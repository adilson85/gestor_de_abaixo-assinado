/**
 * Edge Function: Gerar nova senha temporaria para usuario interno
 * POST /api/admin-management/reset-password
 */

import {
  authenticateRequest,
  createAdminClient,
  generateSecurePassword,
  hasUserPermission,
  jsonResponse,
  logAdminAction,
  resolveAccessProfile,
} from "./utils.ts";

interface ResetPasswordRequest {
  userId?: string;
}

export default async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return jsonResponse({}, 204);
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const body: ResetPasswordRequest = await request.json();
    const targetUserId = body.userId;

    if (!targetUserId) {
      return jsonResponse(
        {
          success: false,
          error: "userId e obrigatorio",
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
          error: "Nao autenticado",
          code: "UNAUTHORIZED",
        },
        401
      );
    }

    const canResetPasswords = await hasUserPermission(
      authData.userId,
      "users.reset_password",
      "all",
      authData.email
    );
    if (!canResetPasswords) {
      return jsonResponse(
        {
          success: false,
          error: "Acesso negado - voce nao possui permissao para resetar senhas.",
          code: "FORBIDDEN",
        },
        403
      );
    }

    if (targetUserId === authData.userId) {
      return jsonResponse(
        {
          success: false,
          error: "Use Minha conta para trocar a propria senha.",
          code: "SELF_PASSWORD_RESET",
        },
        403
      );
    }

    const targetProfile = await resolveAccessProfile(targetUserId);
    if (!targetProfile) {
      return jsonResponse(
        {
          success: false,
          error: "Usuario interno nao encontrado.",
          code: "NOT_FOUND",
        },
        404
      );
    }

    const supabase = createAdminClient();
    const tempPassword = generateSecurePassword(20);

    const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
      password: tempPassword,
    });

    if (updateError) {
      console.error("Erro ao resetar senha do usuario:", updateError);
      return jsonResponse(
        {
          success: false,
          error: "Erro ao gerar senha temporaria.",
          code: "PASSWORD_RESET_ERROR",
        },
        500
      );
    }

    await logAdminAction("USER_PASSWORD_RESET", authData.userId, targetProfile.email, {
      targetUserId,
      targetRole: targetProfile.role,
    });

    return jsonResponse(
      {
        success: true,
        userId: targetUserId,
        email: targetProfile.email,
        tempPassword,
        message: "Senha temporaria gerada com sucesso.",
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado em reset-password:", error);
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
  path: "/api/admin-management/reset-password",
};
