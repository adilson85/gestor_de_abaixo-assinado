/**
 * Edge Function: Desativar usuário interno
 * POST /api/admin-management/remove-admin
 *
 * Compatibilidade:
 * - O path legado é mantido
 * - A operação agora desativa usuários do painel, não apaga auth.users
 */

import {
  authenticateRequest,
  createAdminClient,
  hasUserPermission,
  jsonResponse,
  logAdminAction,
  resolveAccessProfile,
} from "./utils.ts";

interface DeactivateUserRequest {
  userId?: string;
  adminId?: string;
}

export default async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return jsonResponse({}, 204);
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const body: DeactivateUserRequest = await request.json();
    const targetUserId = body.userId || body.adminId;

    if (!targetUserId) {
      return jsonResponse(
        {
          success: false,
          error: "userId é obrigatório",
          code: "MISSING_USER_ID",
        },
        400
      );
    }

    const authData = await authenticateRequest(request);
    if (!authData) {
      return jsonResponse(
        {
          success: false,
          error: "Não autenticado",
          code: "UNAUTHORIZED",
        },
        401
      );
    }

    const canDeactivateUsers = await hasUserPermission(
      authData.userId,
      "users.deactivate",
      "all",
      authData.email
    );
    if (!canDeactivateUsers) {
      return jsonResponse(
        {
          success: false,
          error: "Acesso negado - voce nao possui permissao para desativar usuarios.",
          code: "FORBIDDEN",
        },
        403
      );
    }

    if (targetUserId === authData.userId) {
      return jsonResponse(
        {
          success: false,
          error: "Você não pode desativar a si mesmo.",
          code: "SELF_DEACTIVATION",
        },
        403
      );
    }

    const supabase = createAdminClient();
    const targetProfile = await resolveAccessProfile(targetUserId);

    if (!targetProfile) {
      return jsonResponse(
        {
          success: false,
          error: "Usuário interno não encontrado.",
          code: "NOT_FOUND",
        },
        404
      );
    }

    if (targetProfile.role === "admin") {
      const { count, error: countError } = await supabase
        .from("app_users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("is_active", true);

      if (countError) {
        console.error("Erro ao contar administradores ativos:", countError);
      } else if ((count || 0) <= 1) {
        return jsonResponse(
          {
            success: false,
            error: "É necessário manter pelo menos um administrador ativo no painel.",
            code: "LAST_ADMIN",
          },
          409
        );
      }
    }

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    if (updateError) {
      console.error("Erro ao desativar usuário interno:", updateError);
      return jsonResponse(
        {
          success: false,
          error: "Erro ao desativar o usuário.",
          code: "PROFILE_DEACTIVATE_ERROR",
        },
        500
      );
    }

    await logAdminAction("USER_DEACTIVATED", authData.userId, targetProfile.email, {
      targetUserId,
      previousRole: targetProfile.role,
    });

    return jsonResponse(
      {
        success: true,
        message: "Usuário desativado com sucesso.",
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado em remove-admin:", error);
    return jsonResponse(
      {
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      },
      500
    );
  }
}

export const config = {
  path: "/api/admin-management/remove-admin",
};
