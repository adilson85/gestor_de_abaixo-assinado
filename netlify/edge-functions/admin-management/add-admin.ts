/**
 * Edge Function: Criar ou atualizar usuario interno
 * POST /api/admin-management/add-admin
 *
 * Compatibilidade:
 * - O path legado e mantido
 * - Agora o endpoint gerencia admins/operators e a matriz de permissoes
 */

import {
  AppRole,
  authenticateRequest,
  createAdminClient,
  findAuthUserByEmail,
  generateSecurePassword,
  hasUserPermission,
  isValidEmail,
  isValidRole,
  jsonResponse,
  logAdminAction,
  normalizeEmail,
  replaceUserPermissions,
  resolveAccessProfile,
} from "./utils.ts";

interface UpsertUserRequest {
  email: string;
  fullName?: string;
  role?: AppRole;
  permissions?: Record<string, unknown>;
}

interface UpsertUserResponse {
  success: boolean;
  userId?: string;
  email?: string;
  role?: AppRole;
  createdAuthUser?: boolean;
  createdProfile?: boolean;
  reactivated?: boolean;
  tempPassword?: string;
  message?: string;
  permissions?: Record<string, string>;
  error?: string;
  code?: string;
}

export default async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return jsonResponse({}, 204);
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const body: UpsertUserRequest = await request.json();
    const email = normalizeEmail(body.email || "");
    const fullName = body.fullName?.trim() || null;
    const role = body.role || "admin";

    if (!isValidEmail(email)) {
      return jsonResponse(
        {
          success: false,
          error: "Email invalido",
          code: "INVALID_EMAIL",
        },
        400
      );
    }

    if (!isValidRole(role)) {
      return jsonResponse(
        {
          success: false,
          error: "Papel invalido. Use admin ou operator.",
          code: "INVALID_ROLE",
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

    const supabase = createAdminClient();
    let authUser = await findAuthUserByEmail(email);
    const existingProfile = authUser ? await resolveAccessProfile(authUser.id, email) : null;
    const isNewTarget = !authUser || !existingProfile;

    const canCreateUsers = await hasUserPermission(authData.userId, "users.create", "all", authData.email);
    const canEditProfiles = await hasUserPermission(authData.userId, "users.edit_profile", "all", authData.email);
    const canEditPermissions = await hasUserPermission(authData.userId, "users.edit_permissions", "all", authData.email);
    const canDeactivateUsers = await hasUserPermission(authData.userId, "users.deactivate", "all", authData.email);

    if (isNewTarget && !canCreateUsers) {
      return jsonResponse(
        {
          success: false,
          error: "Acesso negado - voce nao possui permissao para criar usuarios.",
          code: "FORBIDDEN_CREATE",
        },
        403
      );
    }

    if (!isNewTarget && !canEditProfiles) {
      return jsonResponse(
        {
          success: false,
          error: "Acesso negado - voce nao possui permissao para editar usuarios.",
          code: "FORBIDDEN_EDIT_PROFILE",
        },
        403
      );
    }

    if (body.permissions && !canEditPermissions) {
      return jsonResponse(
        {
          success: false,
          error: "Acesso negado - voce nao possui permissao para editar permissoes.",
          code: "FORBIDDEN_EDIT_PERMISSIONS",
        },
        403
      );
    }

    let tempPassword: string | undefined;
    let createdAuthUser = false;

    if (!authUser) {
      tempPassword = generateSecurePassword(20);

      const { data: createdUserData, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : undefined,
      });

      if (createUserError || !createdUserData.user) {
        console.error("Erro ao criar usuario de autenticacao:", createUserError);
        return jsonResponse(
          {
            success: false,
            error: "Erro ao criar usuario no sistema de autenticacao.",
            code: "AUTH_CREATE_ERROR",
          },
          500
        );
      }

      authUser = createdUserData.user;
      createdAuthUser = true;
    } else if (fullName) {
      const currentFullName =
        typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : null;

      if (currentFullName !== fullName) {
        await supabase.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...authUser.user_metadata,
            full_name: fullName,
          },
        });
      }
    }

    const profileBeforeUpsert = await resolveAccessProfile(authUser.id, email);
    const isSelfTarget = authUser.id === authData.userId;

    if (profileBeforeUpsert && !profileBeforeUpsert.isActive && !canDeactivateUsers) {
      return jsonResponse(
        {
          success: false,
          error: "Acesso negado - voce nao possui permissao para reativar usuarios.",
          code: "FORBIDDEN_REACTIVATE",
        },
        403
      );
    }

    if (isSelfTarget && role !== "admin") {
      return jsonResponse(
        {
          success: false,
          error: "Voce nao pode remover seu proprio acesso de administrador por esta acao.",
          code: "SELF_ROLE_CHANGE",
        },
        403
      );
    }

    const payload = {
      user_id: authUser.id,
      email,
      full_name: fullName,
      role,
      is_active: true,
      created_by: authData.userId,
    };

    let createdProfile = false;
    let reactivated = false;

    if (profileBeforeUpsert) {
      const { error: updateError } = await supabase
        .from("app_users")
        .update({
          email,
          full_name: fullName ?? profileBeforeUpsert.fullName ?? null,
          role,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", authUser.id);

      if (updateError) {
        console.error("Erro ao atualizar app_users:", updateError);
        return jsonResponse(
          {
            success: false,
            error: "Erro ao atualizar o usuario interno.",
            code: "PROFILE_UPDATE_ERROR",
          },
          500
        );
      }

      reactivated = !profileBeforeUpsert.isActive;
    } else {
      const { error: insertError } = await supabase.from("app_users").insert(payload);

      if (insertError) {
        console.error("Erro ao inserir app_users:", insertError);

        if (createdAuthUser) {
          try {
            await supabase.auth.admin.deleteUser(authUser.id);
          } catch (rollbackError) {
            console.error("Erro ao fazer rollback do auth user:", rollbackError);
          }
        }

        return jsonResponse(
          {
            success: false,
            error: "Erro ao criar o perfil interno do usuario.",
            code: "PROFILE_CREATE_ERROR",
          },
          500
        );
      }

      createdProfile = true;
    }

    const effectivePermissions = await replaceUserPermissions(authUser.id, role, body.permissions);

    await logAdminAction("USER_UPSERTED", authData.userId, email, {
      role,
      createdAuthUser,
      createdProfile,
      reactivated,
      targetUserId: authUser.id,
      permissions: effectivePermissions,
    });

    const response: UpsertUserResponse = {
      success: true,
      userId: authUser.id,
      email,
      role,
      createdAuthUser,
      createdProfile,
      reactivated,
      permissions: effectivePermissions,
      message: createdAuthUser
        ? "Usuario criado com sucesso. Senha temporaria gerada."
        : createdProfile
          ? "Usuario interno criado com sucesso."
          : "Usuario atualizado com sucesso.",
    };

    if (tempPassword) {
      response.tempPassword = tempPassword;
    }

    return jsonResponse(response, 200);
  } catch (error) {
    console.error("Erro inesperado em add-admin:", error);
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
  path: "/api/admin-management/add-admin",
};
