/**
 * Edge Function: Limpeza global dos dados operacionais
 * POST /api/admin-management/wipe-data
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

    const canWipeData = await hasUserPermission(authData.userId, "settings.wipe_data", "all", authData.email);
    if (!canWipeData) {
      return jsonResponse(
        {
          success: false,
          error: "Acesso negado - voce nao possui permissao para limpar dados.",
          code: "FORBIDDEN",
        },
        403
      );
    }

    const supabase = createAdminClient();

    for (const tableName of OPERATIONAL_DELETE_ORDER) {
      const { error } = await supabase.from(tableName).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        throw new Error(`Erro ao limpar ${tableName}: ${error.message}`);
      }
    }

    await logAdminAction("SYSTEM_WIPE_DATA", authData.userId, authData.email, {
      wipedTables: OPERATIONAL_DELETE_ORDER,
    });

    return jsonResponse(
      {
        success: true,
        message: "Dados operacionais apagados com sucesso. A estrutura do Kanban foi preservada.",
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado em wipe-data:", error);
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
  path: "/api/admin-management/wipe-data",
};
