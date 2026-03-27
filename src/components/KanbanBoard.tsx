import React, { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Archive, ArchiveRestore, AlertTriangle, Columns3, ListTodo, Settings, SlidersHorizontal } from 'lucide-react';
import { KanbanBoard, KanbanColumn as KanbanColumnType, KanbanTask } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanFilters } from './KanbanFilters';
import { KanbanTaskModal } from './KanbanTaskModal';
import { ArchivedTasksModal } from './ArchivedTasksModal';
import {
  getGlobalKanbanBoard,
  getKanbanColumns,
  getKanbanTasks,
  moveKanbanTask,
  searchKanbanTasks,
  updateKanbanTask,
} from '../utils/kanban-storage';

interface KanbanBoardProps {
  petitionId?: string;
}

export const KanbanBoardComponent: React.FC<KanbanBoardProps> = () => {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedTasks, setArchivedTasks] = useState<KanbanTask[]>([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    assigneeId: '',
    labelId: '',
    columnId: '',
    priority: '',
    dueDateFilter: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadBoardData();
  }, []);

  useEffect(() => {
    if (filters.searchTerm || Object.values(filters).some((value) => value && value !== '')) {
      loadFilteredTasks();
    } else {
      loadTasks();
    }
  }, [filters, board?.id]);

  const loadBoardData = async () => {
    try {
      setLoading(true);

      const boardData = await getGlobalKanbanBoard();

      if (boardData) {
        setBoard(boardData);

        const [columnsData, tasksData] = await Promise.all([
          getKanbanColumns(boardData.id),
          getKanbanTasks(boardData.id),
        ]);

        setColumns(columnsData);
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Error loading board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!board) return;

    try {
      const tasksData = await getKanbanTasks(board.id);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadArchivedTasks = async () => {
    if (!board) return;

    try {
      const archivedData = await getKanbanTasks(board.id, true);
      setArchivedTasks(archivedData.filter((task) => task.isArchived));
    } catch (error) {
      console.error('Error loading archived tasks:', error);
    }
  };

  const loadFilteredTasks = async () => {
    if (!board) return;

    try {
      const filteredTasks = await searchKanbanTasks(board.id, filters.searchTerm, {
        assigneeId: filters.assigneeId || undefined,
        labelId: filters.labelId || undefined,
        columnId: filters.columnId || undefined,
        priority: filters.priority || undefined,
        dueDateFilter: (filters.dueDateFilter as 'overdue' | 'today' | 'week' | 'month') || undefined,
      });
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error loading filtered tasks:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((item) => item.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    return;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;
    const snapshotTasks = [...tasks];
    const draggedTask = tasks.find((task) => task.id === taskId);

    if (!draggedTask) {
      setActiveTask(null);
      return;
    }

    let targetColumnId: string;
    let newPosition = 0;

    const targetColumn = columns.find((column) => column.id === overId);

    if (targetColumn) {
      targetColumnId = targetColumn.id;
      const columnTasks = tasks.filter((task) => task.columnId === targetColumnId && task.id !== taskId);
      newPosition = columnTasks.length;
    } else {
      const targetTask = tasks.find((task) => task.id === overId);

      if (!targetTask) {
        setActiveTask(null);
        return;
      }

      targetColumnId = targetTask.columnId;
      const columnTasks = tasks
        .filter((task) => task.columnId === targetColumnId && task.id !== taskId)
        .sort((a, b) => a.position - b.position);
      const targetIndex = columnTasks.findIndex((task) => task.id === targetTask.id);
      newPosition = targetIndex >= 0 ? targetIndex : columnTasks.length;
    }

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, columnId: targetColumnId, position: newPosition };
      }

      if (task.columnId === targetColumnId && task.id !== taskId) {
        return {
          ...task,
          position: task.position >= newPosition ? task.position + 1 : task.position,
        };
      }

      return task;
    });

    setTasks(updatedTasks);

    try {
      await moveKanbanTask(taskId, targetColumnId, newPosition);
    } catch (error) {
      console.error('Error moving task:', error);
      setTasks(snapshotTasks);
      setActiveTask(null);
    }

    setActiveTask(null);
  };

  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task);
  };

  const handleTaskUpdate = (updatedTask: KanbanTask) => {
    setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    setSelectedTask(null);
  };

  const handleUnarchiveTask = async (taskId: string) => {
    try {
      const success = await updateKanbanTask(taskId, { isArchived: false });
      if (success) {
        await loadTasks();
        await loadArchivedTasks();
      }
    } catch (error) {
      console.error('Error unarchiving task:', error);
    }
  };

  const handleTaskCreate = (newTask: KanbanTask) => {
    setTasks([...tasks, newTask]);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    setSelectedTask(null);
  };

  const getTasksForColumn = (columnId: string) =>
    tasks
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => a.position - b.position);

  const now = new Date();
  const activeFilterCount = Object.values(filters).filter((value) => value && value !== '').length;
  const highPriorityCount = tasks.filter((task) => task.priority === 'high').length;
  const overdueCount = tasks.filter((task) => task.dueDate && task.dueDate.getTime() < now.getTime()).length;
  const visibleTaskCount = tasks.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">Erro ao carregar o quadro Kanban.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white dark:shadow-xl dark:shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
              Quadro de execução
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{board.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Organize entregas, acompanhe prazos e mantenha cada campanha avançando com visibilidade para toda a equipe.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
            >
              <SlidersHorizontal size={16} />
              {showFilters ? 'Ocultar filtros' : 'Abrir filtros'}
            </button>
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                if (!showArchived) {
                  loadArchivedTasks();
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
            >
              {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
              {showArchived ? 'Ocultar arquivados' : 'Ver arquivados'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-100">
              <ListTodo size={16} />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Tarefas visíveis</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{visibleTaskCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-100">
              <Columns3 size={16} />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Etapas do quadro</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{columns.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-200">
              <AlertTriangle size={16} />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Alta prioridade</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{highPriorityCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-200">
              <Settings size={16} />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Filtros ativos</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{activeFilterCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              {overdueCount} tarefa{overdueCount === 1 ? '' : 's'} vencida{overdueCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {showFilters ? (
        <KanbanFilters
          filters={filters}
          onFiltersChange={setFilters}
          columns={columns}
          onClose={() => setShowFilters(false)}
        />
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
          Arraste tarefas entre colunas para atualizar a etapa.
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
          Clique em uma tarefa para abrir os detalhes completos.
        </span>
      </div>

      <div className="flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Quadro em andamento</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visualize as tarefas por etapa e mova cada item conforme a execução avançar.
          </p>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full min-w-max items-start gap-4 pb-4">
              {columns.map((column) => (
                <div key={column.id} className="h-full w-80 flex-shrink-0">
                  <KanbanColumn
                    column={column}
                    tasks={getTasksForColumn(column.id)}
                    onTaskClick={handleTaskClick}
                    onTaskCreate={handleTaskCreate}
                  />
                </div>
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="cursor-grabbing opacity-50">
                  <div className="rotate-2 scale-105 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-700">
                    <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">{activeTask.title}</h4>
                    {activeTask.description ? (
                      <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{activeTask.description}</p>
                    ) : null}
                    {activeTask.priority ? (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                          {activeTask.priority === 'high'
                            ? 'Alta'
                            : activeTask.priority === 'medium'
                              ? 'Média'
                              : 'Baixa'}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {selectedTask ? (
        <KanbanTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          boardId={board.id}
        />
      ) : null}

      <ArchivedTasksModal
        isOpen={showArchived}
        onClose={() => setShowArchived(false)}
        archivedTasks={archivedTasks}
        onTaskUnarchive={handleUnarchiveTask}
        onTaskDelete={handleTaskDelete}
      />
    </div>
  );
};
