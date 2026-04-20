/**
 * Utilitarios compartilhados para Edge Functions de gerenciamento do painel
 * @module admin-management/utils
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
}

export type AppRole = "admin" | "operator";
export type PermissionScope = "none" | "own" | "assigned" | "all";
export type PermissionMap = Record<string, PermissionScope>;

export interface AppUserRecord {
  userId: string;
  email: string;
  fullName?: string;
  role: AppRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions?: PermissionMap;
}

interface AppUserRow {
  user_id: string;
  email: string;
  full_name?: string | null;
  role: AppRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AppPermissionRow {
  code: string;
  allowed_scopes: PermissionScope[];
  default_operator_scope: PermissionScope;
}

interface AppUserPermissionRow {
  permission_code: string;
  scope: PermissionScope;
}

/**
 * Cria cliente Supabase com service role key.
 * Deve ser usado apenas em Edge Functions.
 */
export function createAdminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Normaliza email para o formato salvo no banco.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Gera senha segura com 20+ caracteres.
 */
export function generateSecurePassword(length = 20): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = lowercase + uppercase + numbers + symbols;

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let password = "";
  password += uppercase[array[0] % uppercase.length];
  password += lowercase[array[1] % lowercase.length];
  password += numbers[array[2] % numbers.length];
  password += symbols[array[3] % symbols.length];

  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }

  return password.split("").sort(() => 0.5 - Math.random()).join("");
}

/**
 * Valida formato de email.
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida papel permitido para o painel.
 */
export function isValidRole(role: string): role is AppRole {
  return role === "admin" || role === "operator";
}

export function isValidPermissionScope(scope: string): scope is PermissionScope {
  return scope === "none" || scope === "own" || scope === "assigned" || scope === "all";
}

export interface AuthenticatedRequest {
  userId: string;
  email: string;
  token: string;
}

/**
 * Autentica request e retorna dados do usuario.
 */
export async function authenticateRequest(request: Request): Promise<AuthenticatedRequest | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;

  return {
    userId: data.user.id,
    email: data.user.email,
    token,
  };
}

const mapAppUserRow = (row: AppUserRow): AppUserRecord => ({
  userId: row.user_id,
  email: row.email,
  fullName: row.full_name || undefined,
  role: row.role,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function getAppUserRecord(userId: string): Promise<AppUserRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapAppUserRow(data);
}

async function listPermissionDefinitions(): Promise<AppPermissionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_permissions")
    .select("code, allowed_scopes, default_operator_scope")
    .order("code", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as AppPermissionRow[];
}

async function listStoredUserPermissions(userId: string): Promise<PermissionMap> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_user_permissions")
    .select("permission_code, scope")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return ((data || []) as AppUserPermissionRow[]).reduce<PermissionMap>((acc, row) => {
    acc[row.permission_code] = row.scope;
    return acc;
  }, {});
}

function buildEmptyPermissionMap(definitions: AppPermissionRow[]): PermissionMap {
  return definitions.reduce<PermissionMap>((acc, definition) => {
    acc[definition.code] = "none";
    return acc;
  }, {});
}

export async function buildDefaultOperatorPermissions(): Promise<PermissionMap> {
  const definitions = await listPermissionDefinitions();
  return definitions.reduce<PermissionMap>((acc, definition) => {
    acc[definition.code] = definition.default_operator_scope || "none";
    return acc;
  }, {});
}

/**
 * Resolve o perfil efetivo do usuario exclusivamente a partir de app_users.
 */
export async function resolveAccessProfile(
  userId: string,
  _fallbackEmail?: string
): Promise<AppUserRecord | null> {
  return getAppUserRecord(userId);
}

export async function resolveEffectivePermissions(
  userId: string,
  fallbackEmail?: string
): Promise<PermissionMap> {
  const definitions = await listPermissionDefinitions();
  const baseMap = buildEmptyPermissionMap(definitions);
  const profile = await resolveAccessProfile(userId, fallbackEmail);

  if (!profile || !profile.isActive) {
    return baseMap;
  }

  if (profile.role === "admin") {
    return definitions.reduce<PermissionMap>((acc, definition) => {
      acc[definition.code] = "all";
      return acc;
    }, baseMap);
  }

  const storedPermissions = await listStoredUserPermissions(userId);

  return definitions.reduce<PermissionMap>((acc, definition) => {
    const explicitScope = storedPermissions[definition.code];
    acc[definition.code] = explicitScope || definition.default_operator_scope || "none";
    return acc;
  }, baseMap);
}

export async function getPermissionScopeForUser(
  userId: string,
  permissionCode: string,
  fallbackEmail?: string
): Promise<PermissionScope> {
  const permissions = await resolveEffectivePermissions(userId, fallbackEmail);
  return permissions[permissionCode] || "none";
}

export async function hasUserPermission(
  userId: string,
  permissionCode: string,
  requiredScope: PermissionScope | "any" = "all",
  fallbackEmail?: string
): Promise<boolean> {
  const scope = await getPermissionScopeForUser(userId, permissionCode, fallbackEmail);

  if (requiredScope === "any") {
    return scope !== "none";
  }

  if (requiredScope === "all") {
    return scope === "all";
  }

  if (requiredScope === "assigned") {
    return scope === "assigned" || scope === "all";
  }

  if (requiredScope === "own") {
    return scope === "own" || scope === "all";
  }

  return scope !== "none";
}

/**
 * Verifica se userId e administrador ativo.
 */
export async function isUserAdmin(userId: string, email?: string): Promise<boolean> {
  const profile = await resolveAccessProfile(userId, email);
  return !!profile && profile.isActive && profile.role === "admin";
}

/**
 * Busca usuario de autenticacao pelo email.
 */
export async function findAuthUserByEmail(email: string) {
  const supabase = createAdminClient();
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === normalizedEmail) || null;
}

function sanitizePermissionMap(
  permissionMap: Record<string, unknown> | undefined,
  definitions: AppPermissionRow[]
): PermissionMap {
  const nextMap = buildEmptyPermissionMap(definitions);

  if (!permissionMap) {
    return nextMap;
  }

  const definitionsMap = new Map(definitions.map((definition) => [definition.code, definition]));

  Object.entries(permissionMap).forEach(([permissionCode, scopeValue]) => {
    const definition = definitionsMap.get(permissionCode);
    if (!definition) {
      return;
    }

    if (typeof scopeValue !== "string" || !isValidPermissionScope(scopeValue)) {
      return;
    }

    if (!definition.allowed_scopes.includes(scopeValue)) {
      return;
    }

    nextMap[permissionCode] = scopeValue;
  });

  return nextMap;
}

export async function replaceUserPermissions(
  userId: string,
  role: AppRole,
  permissionMap?: Record<string, unknown>
): Promise<PermissionMap> {
  const supabase = createAdminClient();
  const definitions = await listPermissionDefinitions();

  if (role === "admin") {
    await supabase.from("app_user_permissions").delete().eq("user_id", userId);

    return definitions.reduce<PermissionMap>((acc, definition) => {
      acc[definition.code] = "all";
      return acc;
    }, buildEmptyPermissionMap(definitions));
  }

  let normalizedPermissions = sanitizePermissionMap(permissionMap, definitions);
  const hasExplicitPermissions = permissionMap && Object.keys(permissionMap).length > 0;

  if (!hasExplicitPermissions) {
    const existingPermissions = await listStoredUserPermissions(userId);

    if (Object.keys(existingPermissions).length > 0) {
      normalizedPermissions = definitions.reduce<PermissionMap>((acc, definition) => {
        acc[definition.code] = existingPermissions[definition.code] || "none";
        return acc;
      }, buildEmptyPermissionMap(definitions));
    } else {
      normalizedPermissions = definitions.reduce<PermissionMap>((acc, definition) => {
        acc[definition.code] = definition.default_operator_scope || "none";
        return acc;
      }, buildEmptyPermissionMap(definitions));
    }
  }

  const rows = definitions
    .map((definition) => ({
      user_id: userId,
      permission_code: definition.code,
      scope: normalizedPermissions[definition.code] || "none",
    }))
    .filter((row) => row.scope !== "none");

  const { error: deleteError } = await supabase
    .from("app_user_permissions")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("app_user_permissions")
      .insert(rows);

    if (insertError) {
      throw insertError;
    }
  }

  return normalizedPermissions;
}

/**
 * Registra acao de gestao de usuarios no log de auditoria.
 */
export async function logAdminAction(
  actionType: string,
  actorId: string,
  targetEmail: string,
  details: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("admin_audit_log").insert({
    action_type: actionType,
    actor_id: actorId,
    target_email: targetEmail,
    details,
    created_at: new Date().toISOString(),
  });
}

/**
 * Helper para criar resposta JSON com headers CORS.
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
