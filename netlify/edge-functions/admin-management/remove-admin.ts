/**
 * Edge Function: Remover Administrador
 * POST /api/admin-management/remove-admin
 *
 * Fluxo:
 * 1. Autentica requester
 * 2. Verifica se requester é admin
 * 3. Busca dados do admin a ser removido
 * 4. Verifica se não é auto-remoção
 * 5. Remove da tabela admin_users
 * 6. Registra auditoria
 * 7. Retorna sucesso
 */

import { Context } from "https://edge.netlify.com";
import {
  createAdminClient,
  authenticateRequest,
  isUserAdmin,
  logAdminAction,
  jsonResponse
} from "./utils.ts";

interface RemoveAdminRequest {
  adminId: string;
}

interface RemoveAdminResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export default async function handler(request: Request, context: Context) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 204);
  }

  // Apenas POST
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  }

  try {
    // 1. Parse request body
    const body: RemoveAdminRequest = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return jsonResponse({
        success: false,
        error: 'adminId é obrigatório',
        code: 'MISSING_ADMIN_ID'
      }, 400);
    }

    // 2. Autenticar requester
    const authData = await authenticateRequest(request);
    if (!authData) {
      return jsonResponse({
        success: false,
        error: 'Não autenticado',
        code: 'UNAUTHORIZED'
      }, 401);
    }

    const requesterId = authData.userId;

    // 3. Verificar se requester é admin
    const requesterIsAdmin = await isUserAdmin(requesterId);
    if (!requesterIsAdmin) {
      return jsonResponse({
        success: false,
        error: 'Acesso negado - apenas administradores podem remover outros admins',
        code: 'FORBIDDEN'
      }, 403);
    }

    // 4. Buscar dados do admin a ser removido
    const supabase = createAdminClient();
    const { data: targetAdmin, error: fetchError } = await supabase
      .from('admin_users')
      .select('user_id, email')
      .eq('id', adminId)
      .single();

    if (fetchError || !targetAdmin) {
      return jsonResponse({
        success: false,
        error: 'Administrador não encontrado',
        code: 'NOT_FOUND'
      }, 404);
    }

    // 5. Verificar auto-remoção
    if (targetAdmin.user_id === requesterId) {
      return jsonResponse({
        success: false,
        error: 'Você não pode remover a si mesmo como administrador',
        code: 'SELF_REMOVAL'
      }, 403);
    }

    // 6. Remover da tabela admin_users
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId);

    if (deleteError) {
      console.error('Erro ao deletar admin:', deleteError);
      return jsonResponse({
        success: false,
        error: 'Erro ao remover administrador',
        code: 'DB_DELETE_ERROR',
        details: deleteError.message
      }, 500);
    }

    // 7. Registrar auditoria
    await logAdminAction(
      'ADMIN_REMOVED',
      requesterId,
      targetAdmin.email,
      { adminId, targetUserId: targetAdmin.user_id }
    );

    console.log(`Admin removido com sucesso: ${targetAdmin.email} (${adminId})`);

    // 8. Retornar sucesso
    return jsonResponse({
      success: true,
      message: 'Administrador removido com sucesso'
    }, 200);

  } catch (error) {
    console.error('Erro inesperado em remove-admin:', error);
    return jsonResponse({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

export const config = {
  path: "/api/admin-management/remove-admin"
};
