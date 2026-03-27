import { Context } from "https://edge.netlify.com";

const PUBLIC_SITE_URL = (
  Deno.env.get("PUBLIC_SITE_URL") ||
  Deno.env.get("VITE_PUBLIC_SITE_URL") ||
  "https://assinapovo.com.br"
).replace(/\/+$/, "");

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/petition\/([^/]+)$/);

  if (!pathMatch) {
    return context.next();
  }

  const slug = pathMatch[1];
  const targetUrl = new URL(`${PUBLIC_SITE_URL}/${encodeURIComponent(slug)}`);
  targetUrl.search = url.search;

  return Response.redirect(targetUrl.toString(), 308);
}

export const config = {
  path: "/petition/*",
};
