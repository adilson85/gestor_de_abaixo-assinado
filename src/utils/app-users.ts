import { createSessionSupabaseClient, supabase } from '../lib/supabase';
import { AdminAuditLogEntry, AppPermissionMap, AppUser } from '../types';
import { EMPTY_PERMISSION_MAP } from './access';

interface AppUserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppUser['role'];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AppUserPermissionRow {
  user_id: string;
  permission_code: keyof AppPermissionMap;
  scope: AppPermissionMap[keyof AppPermissionMap];
}

interface AdminAuditLogRow {
  id: string;
  action_type: string;
  actor_id: string;
  target_email: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

const mapAppUser = (row: AppUserRow, permissions?: AppPermissionMap): AppUser => ({
  userId: row.user_id,
  email: row.email,
  fullName: row.full_name || undefined,
  role: row.role,
  isActive: row.is_active,
  createdBy: row.created_by || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  permissions,
});

const mapAdminAuditLog = (row: AdminAuditLogRow): AdminAuditLogEntry => ({
  id: row.id,
  actionType: row.action_type,
  actorId: row.actor_id,
  targetEmail: row.target_email,
  details: row.details || undefined,
  createdAt: new Date(row.created_at),
});

const buildPermissionLookup = (rows: AppUserPermissionRow[]) =>
  rows.reduce<Record<string, AppPermissionMap>>((acc, row) => {
    const current = acc[row.user_id] || { ...EMPTY_PERMISSION_MAP };
    current[row.permission_code] = row.scope;
    acc[row.user_id] = current;
    return acc;
  }, {});

const getPermissionRows = async (userIds?: string[]): Promise<AppUserPermissionRow[]> => {
  let query = supabase.from('app_user_permissions').select('user_id, permission_code, scope');

  if (userIds && userIds.length > 0) {
    query = query.in('user_id', userIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar as permissões dos usuários.');
  }

  return (data || []) as AppUserPermissionRow[];
};

export const getAppUserPermissions = async (userIds?: string[]): Promise<Record<string, AppPermissionMap>> => {
  const permissionRows = await getPermissionRows(userIds);
  return buildPermissionLookup(permissionRows);
};

export const getAppUsers = async (options?: {
  includeInactive?: boolean;
  includePermissions?: boolean;
}): Promise<AppUser[]> => {
  let query = supabase.from('app_users').select('*').order('created_at', { ascending: false });

  if (!options?.includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar os usuários.');
  }

  const rows = (data || []) as AppUserRow[];
  let permissionLookup: Record<string, AppPermissionMap> = {};

  if (options?.includePermissions && rows.length > 0) {
    try {
      permissionLookup = await getAppUserPermissions(rows.map((row) => row.user_id));
    } catch (permissionError) {
      console.warn('Não foi possível carregar a matriz completa de permissões dos usuários:', permissionError);
    }
  }

  return rows.map((row) => mapAppUser(row, permissionLookup[row.user_id]));
};

export const getActiveAppUsersByIds = async (userIds: string[]): Promise<AppUser[]> => {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from('app_users').select('*').in('user_id', userIds).eq('is_active', true);

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar os usuários relacionados.');
  }

  const rows = (data || []) as AppUserRow[];
  let permissionLookup: Record<string, AppPermissionMap> = {};

  try {
    permissionLookup = await getAppUserPermissions(rows.map((row) => row.user_id));
  } catch (permissionError) {
    console.warn('Não foi possível carregar permissões dos usuários relacionados:', permissionError);
  }

  return rows.map((row) => mapAppUser(row, permissionLookup[row.user_id]));
};

export const getOwnAppUserProfile = async (userId: string): Promise<AppUser | null> => {
  const { data, error } = await supabase.from('app_users').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar o perfil do usuário.');
  }

  if (!data) {
    return null;
  }

  const permissions = await getAppUserPermissions([userId]);
  return mapAppUser(data as AppUserRow, permissions[userId]);
};

export const getOwnAppUserProfileWithToken = async (
  userId: string,
  accessToken: string
): Promise<AppUser | null> => {
  const sessionClient = createSessionSupabaseClient(accessToken);
  const { data, error } = await sessionClient.from('app_users').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar o perfil do usuário.');
  }

  if (!data) {
    return null;
  }

  const { data: permissionRows, error: permissionError } = await sessionClient
    .from('app_user_permissions')
    .select('user_id, permission_code, scope')
    .eq('user_id', userId);

  if (permissionError) {
    throw new Error(permissionError.message || 'Não foi possível carregar as permissões do usuário.');
  }

  const permissions = buildPermissionLookup((permissionRows || []) as AppUserPermissionRow[]);
  return mapAppUser(data as AppUserRow, permissions[userId]);
};

export const getAdminAuditLog = async (limit = 12): Promise<AdminAuditLogEntry[]> => {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar o log de auditoria.');
  }

  return ((data || []) as AdminAuditLogRow[]).map(mapAdminAuditLog);
};
