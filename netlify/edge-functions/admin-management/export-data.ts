/**
 * Edge Function: Exportar backup operacional
 * GET /api/admin-management/export-data
 */

import { authenticateRequest, createAdminClient, hasUserPermission, jsonResponse } from "./utils.ts";

const TABLES_TO_EXPORT = [
  "petitions",
  "signatures",
  "petition_resources",
  "kanban_boards",
  "kanban_columns",
  "kanban_column_deadlines",
  "kanban_labels",
  "kanban_tasks",
  "kanban_task_assignees",
  "kanban_task_labels",
  "kanban_checklists",
  "kanban_checklist_items",
  "kanban_attachments",
  "kanban_comments",
] as const;

export default async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return jsonResponse({}, 204);
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const authData = await authenticateRequest(request);
    if (!authData) {
      return jsonResponse({ error: "Nao autenticado", code: "UNAUTHORIZED" }, 401);
    }

    const canExport = await hasUserPermission(
      authData.userId,
      "settings.backup_export",
      "all",
      authData.email
    );

    if (!canExport) {
      return jsonResponse(
        {
          error: "Acesso negado - voce nao possui permissao para exportar backups.",
          code: "FORBIDDEN",
        },
        403
      );
    }

    const supabase = createAdminClient();
    const exportedEntries = await Promise.all(
      TABLES_TO_EXPORT.map(async (tableName) => {
        const { data, error } = await supabase.from(tableName).select("*");
        if (error) {
          throw new Error(`Erro ao exportar ${tableName}: ${error.message}`);
        }
        return [tableName, data || []] as const;
      })
    );

    return jsonResponse(
      {
        exportedAt: new Date().toISOString(),
        version: "4.0.0",
        ...Object.fromEntries(exportedEntries),
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado em export-data:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      },
      500
    );
  }
}

export const config = {
  path: "/api/admin-management/export-data",
};
