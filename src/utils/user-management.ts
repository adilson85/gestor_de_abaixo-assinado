import { Session } from '@supabase/supabase-js';
import { AppPermissionMap, AppRole, AppUser } from '../types';
import { createSessionSupabaseClient } from '../lib/supabase';
import { fetchPanelApi } from './panel-api';

interface ApiErrorShape {
  error?: string;
  message?: string;
  code?: string;
  details?: string;
}

export interface AccessCheckResponse {
  canAccessPanel: boolean;
  isAdmin: boolean;
  role: AppRole | null;
  permissions: AppPermissionMap;
  reason?: string;
  profile?: AppUser;
  userId?: string;
  email?: string;
}

export interface UpsertAppUserPayload {
  userId?: string;
  email: string;
  fullName?: string;
  role: AppRole;
  permissions?: AppPermissionMap;
}

export interface UpsertAppUserResponse {
  success: boolean;
  userId?: string;
  email?: string;
  role?: AppRole;
  permissions?: AppPermissionMap;
  createdAuthUser?: boolean;
  createdProfile?: boolean;
  reactivated?: boolean;
  tempPassword?: string;
  message?: string;
}

interface DeactivateAppUserPayload {
  userId: string;
}

interface ResetPasswordPayload {
  userId: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  userId?: string;
  email?: string;
  tempPassword?: string;
  message?: string;
}

const getApiErrorMessage = (status: number, body: ApiErrorShape) =>
  body.error || body.message || body.details || `Falha na requisição (${status}).`;

const withAuthHeaders = (session: Session, headers?: HeadersInit): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${session.access_token}`,
  ...headers,
});

const isAccessCheckResponse = (body: unknown): body is AccessCheckResponse => {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const candidate = body as Partial<AccessCheckResponse>;
  return typeof candidate.canAccessPanel === 'boolean' && 'role' in candidate && 'permissions' in candidate;
};

const parseJsonSafely = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const shouldUseLocalRpcFallback = (status: number, userId?: string) =>
  !!userId && (status === 404 || status === 405);

const upsertAppUserViaRpc = async (
  session: Session,
  payload: UpsertAppUserPayload
): Promise<UpsertAppUserResponse> => {
  if (!payload.userId) {
    throw new Error('Não foi possível editar o usuário sem userId.');
  }

  const sessionClient = createSessionSupabaseClient(session.access_token);
  const { data, error } = await sessionClient.rpc('upsert_internal_user_profile', {
    target_user_id: payload.userId,
    target_email: payload.email,
    target_full_name: payload.fullName ?? null,
    target_role: payload.role,
    target_permissions: payload.permissions ?? {},
  });

  if (error) {
    throw new Error(error.message || 'Não foi possível atualizar o usuário pelo fallback local.');
  }

  return data as UpsertAppUserResponse;
};

const deactivateAppUserViaRpc = async (session: Session, payload: DeactivateAppUserPayload): Promise<void> => {
  const sessionClient = createSessionSupabaseClient(session.access_token);
  const { error } = await sessionClient.rpc('deactivate_internal_user', {
    target_user_id: payload.userId,
  });

  if (error) {
    throw new Error(error.message || 'Não foi possível desativar o usuário pelo fallback local.');
  }
};

export const fetchCurrentAccess = async (session: Session): Promise<AccessCheckResponse> => {
  const response = await fetchPanelApi(`/api/admin-management/check-admin?ts=${Date.now()}`, {
    method: 'GET',
    headers: withAuthHeaders(session, {
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache',
    }),
    cache: 'no-store',
  });

  const body = (await parseJsonSafely(response)) as AccessCheckResponse & ApiErrorShape;

  if (!response.ok || !isAccessCheckResponse(body)) {
    throw new Error(getApiErrorMessage(response.status, body));
  }

  return body;
};

export const upsertAppUser = async (
  session: Session,
  payload: UpsertAppUserPayload
): Promise<UpsertAppUserResponse> => {
  try {
    const response = await fetchPanelApi('/api/admin-management/add-admin', {
      method: 'POST',
      headers: withAuthHeaders(session),
      body: JSON.stringify(payload),
    });

    const body = (await parseJsonSafely(response)) as UpsertAppUserResponse & ApiErrorShape;

    if ((!response.ok || !body.success) && shouldUseLocalRpcFallback(response.status, payload.userId)) {
      return upsertAppUserViaRpc(session, payload);
    }

    if (!response.ok || !body.success) {
      throw new Error(getApiErrorMessage(response.status, body));
    }

    return body;
  } catch (error) {
    if (payload.userId) {
      return upsertAppUserViaRpc(session, payload);
    }

    throw error;
  }
};

export const deactivateAppUser = async (
  session: Session,
  payload: DeactivateAppUserPayload
): Promise<void> => {
  try {
    const response = await fetchPanelApi('/api/admin-management/remove-admin', {
      method: 'POST',
      headers: withAuthHeaders(session),
      body: JSON.stringify(payload),
    });

    const body = (await parseJsonSafely(response)) as ApiErrorShape & { success?: boolean };

    if ((!response.ok || !body.success) && shouldUseLocalRpcFallback(response.status, payload.userId)) {
      await deactivateAppUserViaRpc(session, payload);
      return;
    }

    if (!response.ok || !body.success) {
      throw new Error(getApiErrorMessage(response.status, body));
    }
  } catch (error) {
    await deactivateAppUserViaRpc(session, payload);
    return;
  }
};

export const resetAppUserPassword = async (
  session: Session,
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> => {
  const response = await fetchPanelApi('/api/admin-management/reset-password', {
    method: 'POST',
    headers: withAuthHeaders(session),
    body: JSON.stringify(payload),
  });

  const body = (await parseJsonSafely(response)) as ResetPasswordResponse & ApiErrorShape;

  if (!response.ok || !body.success) {
    throw new Error(getApiErrorMessage(response.status, body));
  }

  return body;
};
