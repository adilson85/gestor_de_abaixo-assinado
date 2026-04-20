import { Session } from '@supabase/supabase-js';
import { fetchPanelApi } from './panel-api';

interface ApiErrorShape {
  error?: string;
  message?: string;
  code?: string;
  details?: string;
}

export interface PanelBackupPayload {
  exportedAt: string;
  version: string;
  petitions: Record<string, unknown>[];
  signatures: Record<string, unknown>[];
  petition_resources: Record<string, unknown>[];
  kanban_boards: Record<string, unknown>[];
  kanban_columns: Record<string, unknown>[];
  kanban_column_deadlines: Record<string, unknown>[];
  kanban_labels: Record<string, unknown>[];
  kanban_tasks: Record<string, unknown>[];
  kanban_task_assignees: Record<string, unknown>[];
  kanban_task_labels: Record<string, unknown>[];
  kanban_checklists: Record<string, unknown>[];
  kanban_checklist_items: Record<string, unknown>[];
  kanban_attachments: Record<string, unknown>[];
  kanban_comments: Record<string, unknown>[];
}

const withAuthHeaders = (session: Session, headers?: HeadersInit): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${session.access_token}`,
  ...headers,
});

const getApiErrorMessage = (status: number, body: ApiErrorShape) =>
  body.error || body.message || body.details || `Falha na requisicao (${status}).`;

const parseJsonSafely = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const exportPanelBackup = async (session: Session): Promise<PanelBackupPayload> => {
  const response = await fetchPanelApi('/api/admin-management/export-data', {
    method: 'GET',
    headers: withAuthHeaders(session),
  });

  const body = (await parseJsonSafely(response)) as PanelBackupPayload & ApiErrorShape;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.status, body));
  }

  return body;
};

export const importPanelBackup = async (session: Session, payload: PanelBackupPayload): Promise<string> => {
  const response = await fetchPanelApi('/api/admin-management/import-backup', {
    method: 'POST',
    headers: withAuthHeaders(session),
    body: JSON.stringify(payload),
  });

  const body = (await parseJsonSafely(response)) as ApiErrorShape & { success?: boolean; message?: string };

  if (!response.ok || !body.success) {
    throw new Error(getApiErrorMessage(response.status, body));
  }

  return body.message || 'Backup importado com sucesso.';
};

export const wipePanelData = async (session: Session): Promise<string> => {
  const response = await fetchPanelApi('/api/admin-management/wipe-data', {
    method: 'POST',
    headers: withAuthHeaders(session),
  });

  const body = (await parseJsonSafely(response)) as ApiErrorShape & { success?: boolean; message?: string };

  if (!response.ok || !body.success) {
    throw new Error(getApiErrorMessage(response.status, body));
  }

  return body.message || 'Dados apagados com sucesso.';
};
