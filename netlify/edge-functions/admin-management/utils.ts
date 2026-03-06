/**
 * Utilitários compartilhados para Edge Functions de gerenciamento de admins
 * @module admin-management/utils
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Cria cliente Supabase com service role key
 * ATENÇÃO: Usar apenas em Edge Functions (backend)
 */
export function createAdminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Gera senha segura com 20+ caracteres
 * Garante ao menos: 1 maiúscula, 1 minúscula, 1 número, 1 símbolo
 */
export function generateSecurePassword(length = 20): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = lowercase + uppercase + numbers + symbols;

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  // Garantir ao menos 1 de cada tipo
  let password = '';
  password += uppercase[array[0] % uppercase.length];
  password += lowercase[array[1] % lowercase.length];
  password += numbers[array[2] % numbers.length];
  password += symbols[array[3] % symbols.length];

  // Preencher o restante
  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }

  // Embaralhar para não ter padrão previsível
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Interface para request autenticado
 */
export interface AuthenticatedRequest {
  userId: string;
  email: string;
  token: string;
}

/**
 * Autentica request e retorna dados do usuário
 * Retorna null se não autenticado
 */
export async function authenticateRequest(request: Request): Promise<AuthenticatedRequest | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return {
    userId: data.user.id,
    email: data.user.email!,
    token
  };
}

/**
 * Verifica se userId é administrador ativo
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  return !!data;
}

/**
 * Registra ação de administrador no log de auditoria
 */
export async function logAdminAction(
  actionType: string,
  actorId: string,
  targetEmail: string,
  details: Record<string, any>
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from('admin_audit_log')
    .insert({
      action_type: actionType,
      actor_id: actorId,
      target_email: targetEmail,
      details,
      created_at: new Date().toISOString()
    });
}

/**
 * Helper para criar resposta JSON com headers CORS
 */
export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
