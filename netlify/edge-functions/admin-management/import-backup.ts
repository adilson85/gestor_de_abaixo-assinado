/**
 * Edge Function: Importar backup operacional
 * POST /api/admin-management/import-backup
 */

import { authenticateRequest, createAdminClient, hasUserPermission, jsonResponse, logAdminAction } from "./utils.ts";

const OPERATIONAL_DELETE_ORDER = [
  "kanban_comments",
  "kanban_attachments",
  "kanban_checklist_items",
  "kanban_checklists",
  "kanban_task_labels",
  "kanban_task_assignees",
  "kanban_tasks",
  "petition_resources",
  "signatures",
  "petitions",
] as const;

const UPSERT_TABLES = [
  "kanban_boards",
  "kanban_columns",
  "kanban_column_deadlines",
  "kanban_labels",
] as const;

const INSERT_TABLES = [
  "petitions",
  "signatures",
  "petition_resources",
  "kanban_tasks",
  "kanban_task_assignees",
  "kanban_task_labels",
  "kanban_checklists",
  "kanban_checklist_items",
  "kanban_attachments",
  "kanban_comments",
] as const;

type BackupPayload = Record<string, unknown>;

const getRows = (payload: BackupPayload, tableName: string): Record<string, unknown>[] => {
  const value = payload[tableName];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
};

export default async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return jsonResponse({}, 204);
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const authData = await authenticateRequest(request);
    if (!authData) {
      return jsonResponse({ success: false, error: "Nao autenticado", code: "UNAUTHORIZED" }, 401);
    }

    const canImport = await hasUserPermission(authData.userId, "settings.backup_import", "all", authData.email);
    if (!canImport) {
      return jsonResponse(
        {
          success: false,
          error: "Acesso negado - voce nao possui permissao para importar backups.",
          code: "FORBIDDEN",
        },
        403
      );
    }

    const payload = (await request.json()) as BackupPayload;

    if (!payload || typeof payload !== "object") {
      return jsonResponse(
        {
          success: false,
          error: "Payload de backup invalido.",
          code: "INVALID_PAYLOAD",
        },
        400
      );
    }

    const supabase = createAdminClient();

    for (const tableName of OPERATIONAL_DELETE_ORDER) {
      const { error } = await supabase.from(tableName).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        throw new Error(`Erro ao limpar ${tableName} antes da importacao: ${error.message}`);
      }
    }

    for (const tableName of UPSERT_TABLES) {
      const rows = getRows(payload, tableName);
      if (rows.length === 0) {
        continue;
      }

      const { error } = await supabase.from(tableName).upsert(rows);
      if (error) {
        throw new Error(`Erro ao importar ${tableName}: ${error.message}`);
      }
    }

    for (const tableName of INSERT_TABLES) {
      const rows = getRows(payload, tableName);
      if (rows.length === 0) {
        continue;
      }

      const { error } = await supabase.from(tableName).insert(rows);
      if (error) {
        throw new Error(`Erro ao importar ${tableName}: ${error.message}`);
      }
    }

    await logAdminAction("SYSTEM_IMPORT_BACKUP", authData.userId, authData.email, {
      importedAt: new Date().toISOString(),
      importedVersion: typeof payload.version === "string" ? payload.version : undefined,
    });

    return jsonResponse(
      {
        success: true,
        message: "Backup importado com sucesso. Recarregue o painel para ver as mudancas.",
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado em import-backup:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      },
      500
    );
  }
}

export const config = {
  path: "/api/admin-management/import-backup",
};
