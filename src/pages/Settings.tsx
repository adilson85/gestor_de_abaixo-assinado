import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Download,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KanbanColumnManager } from '../components/KanbanColumnManager';
import { getAdminAuditLog } from '../utils/app-users';
import { getGlobalKanbanBoard, getKanbanColumns, getColumnDeadlines, saveColumnDeadline } from '../utils/kanban-storage';
import { KanbanColumn, KanbanColumnDeadline } from '../types';
import { exportPanelBackup, importPanelBackup, PanelBackupPayload, wipePanelData } from '../utils/system-management';

const formatDurationUnit = (unit: 'days' | 'months' | 'years') => {
  if (unit === 'days') return 'dias';
  if (unit === 'months') return 'meses';
  return 'anos';
};

export const Settings: React.FC = () => {
  const { session, can } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [deadlines, setDeadlines] = useState<Map<string, KanbanColumnDeadline>>(new Map());
  const [editingDeadlines, setEditingDeadlines] = useState<
    Map<string, { value: number; unit: 'days' | 'months' | 'years' }>
  >(new Map());
  const [savingDeadline, setSavingDeadline] = useState<string | null>(null);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const [showDeadlinesModal, setShowDeadlinesModal] = useState(false);

  const [auditLogs, setAuditLogs] = useState<
    {
      id: string;
      actionType: string;
      targetEmail: string;
      createdAt: Date;
    }[]
  >([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const canManageDeadlines = can('kanban.manage_deadlines', 'any');
  const canManageColumns = can('kanban.manage_columns', 'any');
  const canViewAudit = can('settings.audit_view', 'any');
  const canExportBackup = can('settings.backup_export', 'any');
  const canImportBackup = can('settings.backup_import', 'any');
  const canWipeData = can('settings.wipe_data', 'any');

  useEffect(() => {
    void loadDeadlinesConfig();

    if (canViewAudit) {
      void loadAuditLogs();
    } else {
      setLoadingAudit(false);
      setAuditLogs([]);
    }
  }, [canViewAudit]);

  const configuredDeadlineCount = deadlines.size;
  const pendingDeadlineCount = Math.max(columns.length - configuredDeadlineCount, 0);

  const systemCards = useMemo(
    () =>
      [
        {
          label: 'Etapas do Kanban',
          value: columns.length,
        },
        {
          label: 'Prazos configurados',
          value: configuredDeadlineCount,
        },
        {
          label: 'Etapas sem prazo',
          value: pendingDeadlineCount,
        },
        {
          label: 'Logs recentes',
          value: auditLogs.length,
        },
      ],
    [auditLogs.length, columns.length, configuredDeadlineCount, pendingDeadlineCount]
  );

  const loadDeadlinesConfig = async () => {
    try {
      setLoadingDeadlines(true);
      const board = await getGlobalKanbanBoard();
      if (!board) {
        return;
      }

      const [columnsData, deadlinesData] = await Promise.all([
        getKanbanColumns(board.id),
        getColumnDeadlines(board.id),
      ]);

      setColumns(columnsData);

      const deadlinesMap = new Map<string, KanbanColumnDeadline>();
      deadlinesData.forEach((deadline) => deadlinesMap.set(deadline.columnId, deadline));
      setDeadlines(deadlinesMap);

      const editingMap = new Map<string, { value: number; unit: 'days' | 'months' | 'years' }>();
      columnsData.forEach((column) => {
        const deadline = deadlinesMap.get(column.id);
        editingMap.set(column.id, {
          value: deadline?.durationValue || 30,
          unit: deadline?.durationUnit || 'days',
        });
      });
      setEditingDeadlines(editingMap);
    } catch (error) {
      console.error('Erro ao carregar configuracoes de prazo:', error);
    } finally {
      setLoadingDeadlines(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const recentLogs = await getAdminAuditLog(10);
      setAuditLogs(recentLogs);
    } catch (error) {
      console.error('Erro ao carregar auditoria:', error);
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleDeadlineChange = (
    columnId: string,
    field: 'value' | 'unit',
    newValue: number | 'days' | 'months' | 'years'
  ) => {
    const editing = new Map(editingDeadlines);
    const current = editing.get(columnId) || { value: 30, unit: 'days' as const };
    editing.set(columnId, { ...current, [field]: newValue });
    setEditingDeadlines(editing);
  };

  const handleSaveDeadline = async (columnId: string) => {
    const editing = editingDeadlines.get(columnId);
    if (!editing) return;

    setSavingDeadline(columnId);
    try {
      const saved = await saveColumnDeadline(columnId, editing.value, editing.unit);
      if (!saved) {
        alert('Erro ao salvar prazo. Tente novamente.');
        return;
      }

      const updatedDeadlines = new Map(deadlines);
      updatedDeadlines.set(columnId, saved);
      setDeadlines(updatedDeadlines);
      alert('Prazo salvo com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar prazo:', error);
      alert('Erro ao salvar prazo. Tente novamente.');
    } finally {
      setSavingDeadline(null);
    }
  };

  const handleExportData = async () => {
    if (!session) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    setIsLoading(true);

    try {
      const exportData = await exportPanelBackup(session);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup-assinapovo-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert(error instanceof Error ? error.message : 'Erro ao exportar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = () => {
    if (!session) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        try {
          const payload = JSON.parse(readerEvent.target?.result as string) as PanelBackupPayload;
          const message = await importPanelBackup(session, payload);
          alert(message);
          await Promise.all([loadDeadlinesConfig(), loadAuditLogs()]);
        } catch (error) {
          console.error('Erro ao importar dados:', error);
          alert(error instanceof Error ? error.message : 'Erro ao importar o backup.');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearData = async () => {
    if (!session) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!confirm('Tem certeza que deseja apagar todos os dados operacionais? Esta acao nao pode ser desfeita.')) {
      return;
    }

    setIsLoading(true);

    try {
      const message = await wipePanelData(session);
      alert(message);
      await Promise.all([loadDeadlinesConfig(), loadAuditLogs()]);
    } catch (error) {
      console.error('Erro ao apagar dados:', error);
      alert(error instanceof Error ? error.message : 'Erro ao apagar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white dark:shadow-xl dark:shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
              Configurações do sistema
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Operação sistêmica do AssinaPovo Admin
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Ajuste prazos estruturais do Kanban, acompanhe auditoria e execute rotinas globais com protecao extra.
            </p>
          </div>

          {canManageDeadlines ? (
            <button
              onClick={() => setShowDeadlinesModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Clock size={16} />
              Configurar prazos do Kanban
            </button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {systemCards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className={`grid gap-6 ${canManageColumns ? 'xl:grid-cols-[1.05fr_0.95fr]' : ''}`}>
        {canManageColumns ? <KanbanColumnManager onStructureChanged={loadDeadlinesConfig} /> : null}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Automacao do Kanban</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Defina o prazo padrao de cada etapa para manter alertas e vencimentos coerentes com a operacao.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loadingDeadlines ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
              </div>
            ) : columns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nenhuma etapa de Kanban encontrada.
              </div>
            ) : (
              columns.map((column) => {
                const deadline = deadlines.get(column.id);
                return (
                  <div key={column.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-950 dark:text-white">{column.name}</p>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {deadline ? `${deadline.durationValue} ${formatDurationUnit(deadline.durationUnit)}` : 'Sem prazo'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Ambiente do painel</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Referência rápida do que está ativo no admin e das rotinas que exigem maior cuidado.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
            Marca: AssinaPovo Admin
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
            Estrutura: campanhas, assinaturas, Kanban, usuários e Edge Functions protegidas
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
            Segurança: autorização por permissão/escopo com enforcement no frontend, Edge Functions e RLS
          </div>
        </div>
      </section>

      {canViewAudit ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Auditoria recente</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Últimas ações administrativas registradas no painel.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loadingAudit ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nenhum evento de auditoria encontrado.
              </div>
            ) : (
              auditLogs.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">{entry.actionType}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{entry.targetEmail}</p>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {entry.createdAt.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Backups e importação</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Exporte a base atual para backup e importe pacotes somente em janelas controladas.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              onClick={handleExportData}
              disabled={isLoading || !canExportBackup}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-blue-500/30"
            >
              <Download size={18} className="text-blue-600 dark:text-blue-300" />
              <p className="mt-3 font-semibold text-slate-950 dark:text-white">
                {isLoading ? 'Exportando...' : 'Exportar dados'}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Gera um arquivo JSON com campanhas, apoios e estrutura operacional.
              </p>
            </button>

            <button
              onClick={handleImportData}
              disabled={isLoading || !canImportBackup}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-emerald-500/30"
            >
              <Upload size={18} className="text-emerald-600 dark:text-emerald-300" />
              <p className="mt-3 font-semibold text-slate-950 dark:text-white">
                {isLoading ? 'Importando...' : 'Importar backup'}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Substitui a base operacional atual pelo arquivo selecionado.
              </p>
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Zona de risco operacional</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Use estas acoes apenas com confirmacao da equipe responsavel. Elas impactam toda a operacao do painel.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-red-200 bg-white/80 p-4 dark:border-red-900/40 dark:bg-slate-950/30">
            <p className="font-semibold text-slate-950 dark:text-white">Limpeza total dos dados operacionais</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Remove campanhas, assinaturas e cards, preservando a estrutura principal do Kanban.
            </p>
            <button
              onClick={handleClearData}
              disabled={isLoading || !canWipeData}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AlertTriangle size={16} />
              {isLoading ? 'Apagando...' : 'Apagar todos os dados'}
            </button>
          </div>
        </section>
      </div>

      {showDeadlinesModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setShowDeadlinesModal(false)}
          />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                  Prazos do Kanban
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  Defina o vencimento automático por etapa
                </h2>
              </div>
              <button
                onClick={() => setShowDeadlinesModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              {loadingDeadlines ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              ) : columns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Nenhuma etapa encontrada para configurar.
                </div>
              ) : (
                <div className="space-y-4">
                  {columns.map((column) => {
                    const deadline = deadlines.get(column.id);
                    const editing = editingDeadlines.get(column.id) || { value: 30, unit: 'days' as const };
                    const isSaving = savingDeadline === column.id;
                    const hasChanged =
                      !deadline ||
                      deadline.durationValue !== editing.value ||
                      deadline.durationUnit !== editing.unit;

                    return (
                      <div key={column.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-slate-950 dark:text-white">{column.name}</p>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {deadline
                              ? `Atual: ${deadline.durationValue} ${formatDurationUnit(deadline.durationUnit)}`
                              : 'Ainda sem prazo definido'}
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            type="number"
                            min="1"
                            value={editing.value}
                            onChange={(event) =>
                              handleDeadlineChange(column.id, 'value', parseInt(event.target.value, 10) || 1)
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                          <select
                            value={editing.unit}
                            onChange={(event) =>
                              handleDeadlineChange(column.id, 'unit', event.target.value as 'days' | 'months' | 'years')
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="days">Dias</option>
                            <option value="months">Meses</option>
                            <option value="years">Anos</option>
                          </select>
                          <button
                            onClick={() => handleSaveDeadline(column.id)}
                            disabled={isSaving || !hasChanged}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Save size={16} />
                            {isSaving ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
