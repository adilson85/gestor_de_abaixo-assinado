/**
 * Edge Function: Adicionar Administrador
 * POST /api/admin-management/add-admin
 *
 * Fluxo:
 * 1. Autentica requester
 * 2. Verifica se requester é admin
 * 3. Valida email do novo admin
 * 4. Verifica se usuário existe no auth.users
 * 5. Se NÃO existe: cria usuário com senha temporária
 * 6. Se JÁ existe: obtém userId
 * 7. Adiciona à tabela admin_users
 * 8. Registra auditoria
 * 9. Retorna resultado (com senha se criou novo usuário)
 */

import { Context } from "https://edge.netlify.com";
import {
  createAdminClient,
  generateSecurePassword,
  isValidEmail,
  authenticateRequest,
  isUserAdmin,
  logAdminAction,
  jsonResponse
} from "./utils.ts";

interface AddAdminRequest {
  email: string;
}

interface AddAdminResponse {
  success: boolean;
  userId?: string;
  email?: string;
  created?: boolean;
  tempPassword?: string;
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
    const body: AddAdminRequest = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return jsonResponse({
        success: false,
        error: 'Email inválido',
        code: 'INVALID_EMAIL'
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
        error: 'Acesso negado - apenas administradores podem adicionar outros admins',
        code: 'FORBIDDEN'
      }, 403);
    }

    // 4. Verificar se email já é admin
    const supabase = createAdminClient();
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (existingAdmin) {
      return jsonResponse({
        success: false,
        error: 'Este email já é administrador',
        code: 'ALREADY_ADMIN'
      }, 409);
    }

    // 5. Verificar se usuário existe no auth.users
    const { data: authUsers, error: searchError } = await supabase.auth.admin.listUsers();

    if (searchError) {
      console.error('Erro ao buscar usuários:', searchError);
      return jsonResponse({
        success: false,
        error: 'Erro ao verificar usuários existentes',
        code: 'DB_ERROR'
      }, 500);
    }

    let userId: string;
    let tempPassword: string | undefined;
    let created = false;

    const existingUser = authUsers?.users.find(u => u.email?.toLowerCase() === email);

    if (!existingUser) {
      // 6A. Criar novo usuário
      tempPassword = generateSecurePassword(20);

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Confirmar email automaticamente
      });

      if (createError || !newUser.user) {
        console.error('Erro ao criar usuário:', createError);
        return jsonResponse({
          success: false,
          error: 'Erro ao criar usuário no sistema de autenticação',
          code: 'AUTH_CREATE_ERROR',
          details: createError?.message
        }, 500);
      }

      userId = newUser.user.id;
      created = true;
      console.log(`Novo usuário criado: ${email} (${userId})`);
    } else {
      // 6B. Usuário já existe
      userId = existingUser.id;
      created = false;
      console.log(`Usuário existente encontrado: ${email} (${userId})`);
    }

    // 7. Adicionar à tabela admin_users
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        email: email,
        created_by: requesterId,
        is_active: true
      });

    if (insertError) {
      console.error('Erro ao inserir admin_users:', insertError);

      // Se criamos o usuário mas falhou ao adicionar na tabela,
      // tentar deletar o usuário criado (rollback manual)
      if (created) {
        try {
          await supabase.auth.admin.deleteUser(userId);
          console.log(`Rollback: usuário ${userId} deletado após falha de insert`);
        } catch (deleteError) {
          console.error('Erro ao fazer rollback:', deleteError);
        }
      }

      return jsonResponse({
        success: false,
        error: 'Erro ao adicionar administrador',
        code: 'DB_INSERT_ERROR',
        details: insertError.message
      }, 500);
    }

    // 8. Registrar auditoria
    await logAdminAction(
      'ADMIN_ADDED',
      requesterId,
      email,
      { created, userId, tempPasswordGenerated: created }
    );

    console.log(`Admin adicionado com sucesso: ${email} (criado: ${created})`);

    // 9. Retornar resposta
    const response: AddAdminResponse = {
      success: true,
      userId,
      email,
      created,
      message: created
        ? 'Administrador criado com sucesso. Senha temporária gerada.'
        : 'Usuário existente adicionado como administrador.'
    };

    if (created && tempPassword) {
      response.tempPassword = tempPassword;
    }

    return jsonResponse(response, 200);

  } catch (error) {
    console.error('Erro inesperado em add-admin:', error);
    return jsonResponse({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

export const config = {
  path: "/api/admin-management/add-admin"
};
