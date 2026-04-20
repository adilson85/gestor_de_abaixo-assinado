/**
 * Edge Function: Verificar acesso interno do usuário
 * GET /api/admin-management/check-admin
 *
 * Compatibilidade:
 * - O path legado é mantido
 * - A resposta agora inclui papel e status de acesso ao painel
 */

import {
  authenticateRequest,
  jsonResponse,
  resolveAccessProfile,
  resolveEffectivePermissions,
} from "./utils.ts";

export default async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return jsonResponse({}, 204);
  }

  if (request.method !== "GET") {
    return jsonResponse({ canAccessPanel: false, isAdmin: false, role: null }, 405);
  }

  try {
    const authData = await authenticateRequest(request);
    if (!authData) {
      return jsonResponse(
        {
          canAccessPanel: false,
          isAdmin: false,
          role: null,
          reason: "UNAUTHORIZED",
        },
        401
      );
    }

    const profile = await resolveAccessProfile(authData.userId, authData.email);
    const isActive = !!profile?.isActive;
    const role = isActive ? profile?.role || null : null;
    const permissions = isActive
      ? await resolveEffectivePermissions(authData.userId, authData.email)
      : {};

    return jsonResponse(
      {
        canAccessPanel: isActive,
        isAdmin: role === "admin",
        role,
        reason: role ? undefined : profile ? "INACTIVE_PROFILE" : "PROFILE_NOT_FOUND",
        userId: authData.userId,
        email: authData.email,
        permissions,
        profile: profile
          ? {
              userId: profile.userId,
              email: profile.email,
              fullName: profile.fullName,
              role: profile.role,
              isActive: profile.isActive,
              createdAt: profile.createdAt,
              updatedAt: profile.updatedAt,
              permissions,
            }
          : null,
      },
      200
    );
  } catch (error) {
    console.error("Erro ao verificar acesso interno:", error);
    return jsonResponse(
      {
        canAccessPanel: false,
        isAdmin: false,
        role: null,
        reason: "INTERNAL_ERROR",
      },
      500
    );
  }
}

export const config = {
  path: "/api/admin-management/check-admin",
};
