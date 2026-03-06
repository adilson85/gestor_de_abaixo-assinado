/**
 * Edge Function: Verificar se usuário é Admin
 * GET /api/admin-management/check-admin
 *
 * Fluxo:
 * 1. Autentica requester
 * 2. Consulta tabela admin_users
 * 3. Retorna status de admin
 *
 * Usada pelo AuthContext para verificar permissões
 */

import { Context } from "https://edge.netlify.com";
import {
  createAdminClient,
  authenticateRequest,
  jsonResponse
} from "./utils.ts";

interface CheckAdminResponse {
  isAdmin: boolean;
  userId?: string;
  email?: string;
}

export default async function handler(request: Request, context: Context) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 204);
  }

  // Apenas GET
  if (request.method !== 'GET') {
    return jsonResponse({ isAdmin: false }, 405);
  }

  try {
    // 1. Autenticar requester
    const authData = await authenticateRequest(request);
    if (!authData) {
      return jsonResponse({ isAdmin: false }, 401);
    }

    const userId = authData.userId;

    // 2. Verificar se é admin
    const supabase = createAdminClient();
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // 3. Retornar resultado
    return jsonResponse({
      isAdmin: !!adminData,
      userId: userId,
      email: authData.email
    }, 200);

  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return jsonResponse({ isAdmin: false }, 500);
  }
}

export const config = {
  path: "/api/admin-management/check-admin"
};
