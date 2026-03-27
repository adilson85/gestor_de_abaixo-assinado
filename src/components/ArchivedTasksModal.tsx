import React, { useState } from 'react';
import { ArchiveRestore, Calendar, Search, Trash2, X } from 'lucide-react';
import { KanbanTask } from '../types';
import { deleteKanbanTask, updateKanbanTask } from '../utils/kanban-storage';

interface ArchivedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedTasks: KanbanTask[];
  onTaskUnarchive: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export const ArchivedTasksModal: React.FC<ArchivedTasksModalProps> = ({
  isOpen,
  onClose,
  archivedTasks,
  onTaskUnarchive,
  onTaskDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredTasks = archivedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedTasks = filteredTasks.reduce((groups, task) => {
    const archiveDate = new Date(task.updatedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - archiveDate.getTime()) / (1000 * 60 * 60 * 24));

    let groupKey: string;

    if (diffDays <= 7) {
      groupKey = 'Esta semana';
    } else if (diffDays <= 14) {
      groupKey = 'Há mais de 7 dias';
    } else if (diffDays <= 30) {
      groupKey = 'Há mais de 14 dias';
    } else {
      groupKey = 'Há mais de 30 dias';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(task);
    return groups;
  }, {} as Record<string, KanbanTask[]>);

  const handleUnarchive = async (taskId: string) => {
    try {
      const success = await updateKanbanTask(taskId, { isArchived: false });
      if (success) {
        onTaskUnarchive(taskId);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Error unarchiving task:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa arquivada permanentemente?')) {
      return;
    }

    try {
      const success = await deleteKanbanTask(taskId);
      if (success) {
        onTaskDelete(taskId);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-200 p-6 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Itens arquivados ({archivedTasks.length})
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Revise histórico, restaure entregas relevantes ou remova itens que não precisam mais ser mantidos.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-200 p-6 dark:border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Pesquisar no arquivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/30 dark:hover:text-blue-300"
            >
              {viewMode === 'grid' ? 'Ver em lista' : 'Ver em grade'}
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-210px)] overflow-y-auto p-6">
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="py-12 text-center">
              <ArchiveRestore size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm ? 'Nenhum item encontrado.' : 'Nenhum item arquivado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([groupName, tasks]) => (
                <div key={groupName}>
                  <h3 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">{groupName}</h3>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-2'}>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          selectedTask?.id === task.id
                            ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600'
                        }`}
                        onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950 line-through dark:text-white">
                              {task.title}
                            </p>
                            {task.description ? (
                              <p className="mt-2 text-sm text-slate-500 line-through dark:text-slate-400">
                                {task.description}
                              </p>
                            ) : null}
                          </div>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            Arquivado
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar size={12} />
                            <span>Arquivado em {new Date(task.updatedAt).toLocaleDateString('pt-BR')}</span>
                          </div>

                          {selectedTask?.id === task.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnarchive(task.id);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                              >
                                <ArchiveRestore size={14} />
                                Restaurar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task.id);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
