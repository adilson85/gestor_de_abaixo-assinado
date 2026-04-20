import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { KanbanBoard, KanbanColumn } from '../types';
import {
  createKanbanColumn,
  deleteKanbanColumn,
  getGlobalKanbanBoard,
  getKanbanColumns,
  getKanbanColumnTaskCounts,
  reorderKanbanColumns,
  updateKanbanColumn,
} from '../utils/kanban-storage';

type FeedbackState =
  | {
      type: 'success' | 'error';
      message: string;
    }
  | null;

interface KanbanColumnManagerProps {
  onStructureChanged?: () => Promise<void> | void;
}

const sortColumns = (columns: KanbanColumn[]) => [...columns].sort((left, right) => left.position - right.position);

export const KanbanColumnManager: React.FC<KanbanColumnManagerProps> = ({ onStructureChanged }) => {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyColumnId, setBusyColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const loadStructure = async () => {
    try {
      setLoading(true);
      const boardData = await getGlobalKanbanBoard();

      if (!boardData) {
        setBoard(null);
        setColumns([]);
        setTaskCounts({});
        return;
      }

      const [columnsData, countsData] = await Promise.all([
        getKanbanColumns(boardData.id),
        getKanbanColumnTaskCounts(boardData.id),
      ]);

      setBoard(boardData);
      setColumns(sortColumns(columnsData));
      setTaskCounts(countsData);
    } catch (error) {
      console.error('Erro ao carregar a estrutura do Kanban:', error);
      setFeedback({
        type: 'error',
        message: 'Não foi possível carregar a estrutura atual do Kanban.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStructure();
  }, []);

  const totalCards = useMemo(
    () => Object.values(taskCounts).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
    [taskCounts]
  );

  const syncAfterMutation = async (successMessage: string) => {
    await loadStructure();

    if (onStructureChanged) {
      await onStructureChanged();
    }

    setFeedback({
      type: 'success',
      message: successMessage,
    });
  };

  const handleCreateColumn = async () => {
    if (!board) {
      setFeedback({
        type: 'error',
        message: 'O quadro global do Kanban não foi encontrado.',
      });
      return;
    }

    const normalizedName = newColumnName.trim();

    if (!normalizedName) {
      setFeedback({
        type: 'error',
        message: 'Informe um nome para a nova coluna.',
      });
      return;
    }

    setCreating(true);
    setFeedback(null);

    try {
      const createdColumn = await createKanbanColumn(board.id, normalizedName);

      if (!createdColumn) {
        throw new Error('Não foi possível criar a coluna.');
      }

      setNewColumnName('');
      await syncAfterMutation('Coluna criada com sucesso.');
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao criar a coluna.',
      });
    } finally {
      setCreating(false);
    }
  };

  const startEditingColumn = (column: KanbanColumn) => {
    setEditingColumnId(column.id);
    setEditingColumnName(column.name);
    setFeedback(null);
  };

  const handleRenameColumn = async (columnId: string) => {
    const normalizedName = editingColumnName.trim();

    if (!normalizedName) {
      setFeedback({
        type: 'error',
        message: 'Informe um nome válido para a coluna.',
      });
      return;
    }

    setBusyColumnId(columnId);
    setFeedback(null);

    try {
      const success = await updateKanbanColumn(columnId, { name: normalizedName });

      if (!success) {
        throw new Error('Não foi possível renomear a coluna.');
      }

      setEditingColumnId(null);
      setEditingColumnName('');
      await syncAfterMutation('Nome da coluna atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao renomear coluna:', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao renomear a coluna.',
      });
    } finally {
      setBusyColumnId(null);
    }
  };

  const handleMoveColumn = async (columnId: string, direction: 'up' | 'down') => {
    if (!board) {
      return;
    }

    const orderedColumns = sortColumns(columns);
    const currentIndex = orderedColumns.findIndex((column) => column.id === columnId);

    if (currentIndex < 0) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedColumns.length) {
      return;
    }

    const nextOrder = [...orderedColumns];
    const [movedColumn] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(targetIndex, 0, movedColumn);

    setBusyColumnId(columnId);
    setFeedback(null);

    try {
      const success = await reorderKanbanColumns(
        board.id,
        nextOrder.map((column) => column.id)
      );

      if (!success) {
        throw new Error('Não foi possível reordenar as colunas.');
      }

      await syncAfterMutation('Ordem das colunas atualizada com sucesso.');
    } catch (error) {
      console.error('Erro ao reordenar colunas:', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao reordenar as colunas.',
      });
    } finally {
      setBusyColumnId(null);
    }
  };

  const handleDeleteColumn = async (column: KanbanColumn) => {
    const linkedCards = taskCounts[column.id] || 0;

    if (linkedCards > 0) {
      setFeedback({
        type: 'error',
        message: `A coluna "${column.name}" ainda possui ${linkedCards} card(s). Mova ou exclua esses cards antes de remover a coluna.`,
      });
      return;
    }

    if (!confirm(`Excluir a coluna "${column.name}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setBusyColumnId(column.id);
    setFeedback(null);

    try {
      const result = await deleteKanbanColumn(column.id);

      if (!result.success) {
        throw new Error(result.message || 'Não foi possível excluir a coluna.');
      }

      await syncAfterMutation('Coluna excluída com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao excluir a coluna.',
      });
    } finally {
      setBusyColumnId(null);
    }
  };

  const activeRowBusy = (columnId: string) => busyColumnId === columnId;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Estrutura do Kanban</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Adicione, renomeie, reorganize e remova etapas vazias sem misturar isso com a operação diária dos cards.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Estrutura atual
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{columns.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{totalCards} card(s) vinculados</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/30">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={newColumnName}
            onChange={(event) => setNewColumnName(event.target.value)}
            placeholder="Ex.: Validação jurídica"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            onClick={handleCreateColumn}
            disabled={creating || loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {creating ? 'Criando...' : 'Adicionar coluna'}
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={28} className="animate-spin text-blue-600 dark:text-blue-300" />
          </div>
        ) : !board ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            O quadro global do Kanban ainda não está disponível.
          </div>
        ) : columns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhuma coluna cadastrada no quadro.
          </div>
        ) : (
          sortColumns(columns).map((column, index, orderedColumns) => {
            const linkedCards = taskCounts[column.id] || 0;
            const isEditing = editingColumnId === column.id;
            const isBusy = activeRowBusy(column.id);

            return (
              <div
                key={column.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        Etapa {index + 1}
                      </span>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                        {linkedCards} card(s)
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="mt-3 flex flex-col gap-3 md:flex-row">
                        <input
                          type="text"
                          value={editingColumnName}
                          onChange={(event) => setEditingColumnName(event.target.value)}
                          className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => void handleRenameColumn(column.id)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Salvar
                          </button>
                          <button
                            onClick={() => {
                              setEditingColumnId(null);
                              setEditingColumnName('');
                            }}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
                          >
                            <X size={16} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{column.name}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {linkedCards > 0
                            ? 'Esvazie esta etapa antes de excluir a coluna.'
                            : 'Coluna vazia e pronta para exclusão, se necessário.'}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void handleMoveColumn(column.id, 'up')}
                      disabled={isBusy || isEditing || index === 0}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <ArrowUp size={16} />
                      Subir
                    </button>
                    <button
                      onClick={() => void handleMoveColumn(column.id, 'down')}
                      disabled={isBusy || isEditing || index === orderedColumns.length - 1}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <ArrowDown size={16} />
                      Descer
                    </button>
                    <button
                      onClick={() => startEditingColumn(column)}
                      disabled={isBusy || isEditing}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <Pencil size={16} />
                      Renomear
                    </button>
                    <button
                      onClick={() => void handleDeleteColumn(column)}
                      disabled={isBusy || isEditing || linkedCards > 0}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                    >
                      {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
