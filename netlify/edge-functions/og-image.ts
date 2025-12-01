import { Context } from "https://edge.netlify.com";

// Configuração do Supabase (pegar das variáveis de ambiente do Netlify)
// Tenta com e sem prefixo VITE_ para compatibilidade
const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

interface Petition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  responsible: string | null;
  available_online: boolean;
}

async function getPetitionBySlug(slug: string): Promise<Petition | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase credentials not configured. URL:", SUPABASE_URL ? "set" : "missing", "Key:", SUPABASE_ANON_KEY ? "set" : "missing");
    return null;
  }

  try {
    // Buscar apenas petições disponíveis online
    const url = `${SUPABASE_URL}/rest/v1/petitions?slug=eq.${encodeURIComponent(slug)}&available_online=eq.true&select=id,slug,name,description,location,image_url,responsible,available_online&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching petition (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.error("Petition not found for slug:", slug);
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error("Error fetching petition:", error);
    return null;
  }
}

async function getSignatureCount(petitionId: string): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return 0;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/signatures?petition_id=eq.${petitionId}&select=id`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "count=exact",
        },
      }
    );

    const count = response.headers.get("content-range");
    if (count) {
      const match = count.match(/\/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching signature count:", error);
    return 0;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/petition\/([^/]+)$/);

  if (!pathMatch) {
    return context.next();
  }

  const slug = pathMatch[1];
  
  // Verificar se é um crawler/bot de rede social
  const userAgent = request.headers.get("user-agent") || "";
  const isCrawler = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Pinterest|Discordbot|Googlebot|bingbot/i.test(userAgent);

  // Log para debug
  console.log("Request:", {
    path: url.pathname,
    slug,
    userAgent,
    isCrawler,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasSupabaseKey: !!SUPABASE_ANON_KEY,
  });

  // Se não for um crawler, deixar o React SPA lidar com a página
  if (!isCrawler) {
    return context.next();
  }

  // Buscar dados da petição
  const petition = await getPetitionBySlug(slug);

  if (!petition) {
    console.error("Petition not found, falling back to SPA");
    return context.next();
  }
  
  // Verificar se a petição está disponível online
  if (!petition.available_online) {
    console.error("Petition not available online, falling back to SPA");
    return context.next();
  }
  
  console.log("Petition found:", petition.name);

  // Buscar contagem de assinaturas
  const signatureCount = await getSignatureCount(petition.id);

  // Construir meta tags
  const title = `${petition.name} - Abaixo-Assinado`;
  const description = petition.description 
    ? `${petition.description.substring(0, 200)}${petition.description.length > 200 ? '...' : ''}`
    : `Assine este abaixo-assinado e ajude a fazer a diferença. Já são ${signatureCount} assinaturas!`;
  
  // Garantir que a URL da imagem seja absoluta
  let image = `${url.origin}/icon-512x512.png`; // Fallback padrão
  if (petition.image_url) {
    // Se a URL já for absoluta, usar diretamente
    if (petition.image_url.startsWith('http://') || petition.image_url.startsWith('https://')) {
      image = petition.image_url;
    } else {
      // Se for relativa, tornar absoluta
      image = petition.image_url.startsWith('/') 
        ? `${url.origin}${petition.image_url}`
        : `${url.origin}/${petition.image_url}`;
    }
  }
  
  const pageUrl = `${url.origin}/petition/${slug}`;
  
  console.log("Image URL:", image);

  // Gerar HTML com meta tags para crawlers
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  
  <!-- SEO Meta Tags -->
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="abaixo-assinado, petição, ${escapeHtml(petition.name)}, cidadania, participação">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Sistema de Abaixo-Assinados">
  <meta property="og:locale" content="pt_BR">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
  
  <!-- WhatsApp específico -->
  <meta property="og:image:alt" content="${escapeHtml(petition.name)}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${pageUrl}">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/icon-192x192.png">
  
  <!-- Redirect para a página real após alguns segundos (fallback) -->
  <meta http-equiv="refresh" content="0;url=${pageUrl}">
</head>
<body>
  <h1>${escapeHtml(petition.name)}</h1>
  <p>${escapeHtml(description)}</p>
  ${petition.location ? `<p>Local: ${escapeHtml(petition.location)}</p>` : ''}
  <p>Total de assinaturas: ${signatureCount}</p>
  ${petition.responsible ? `<p>Responsável: ${escapeHtml(petition.responsible)}</p>` : ''}
  <p><a href="${pageUrl}">Clique aqui para assinar</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300", // Cache por 5 minutos
    },
  });
}

export const config = {
  path: "/petition/*",
};

