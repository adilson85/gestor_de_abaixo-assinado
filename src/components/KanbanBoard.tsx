import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn as KanbanColumnType, KanbanTask, KanbanBoard } from '../types';
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
  updateKanbanTask
} from '../utils/kanban-storage';
import { Settings, Archive, ArchiveRestore } from 'lucide-react';

interface KanbanBoardProps {
  petitionId?: string; // Opcional para filtrar tarefas por abaixo-assinado
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
    dueDateFilter: ''
  });

  // Sensor com distancia minima para evitar arrastar em cliques
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      },
    })
  );

  useEffect(() => {
    loadBoardData();
  }, []);

  useEffect(() => {
    if (filters.searchTerm || Object.values(filters).some(f => f && f !== '')) {
      loadFilteredTasks();
    } else {
      loadTasks();
    }
  }, [filters, board?.id]);

  const loadBoardData = async () => {
    try {
      setLoading(true);
      
      // Get global board
      const boardData = await getGlobalKanbanBoard();
      
      if (boardData) {
        setBoard(boardData);
        
        // Load columns and tasks
        const [columnsData, tasksData] = await Promise.all([
          getKanbanColumns(boardData.id),
          getKanbanTasks(boardData.id)
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
      console.log('🔄 Carregando tarefas para board:', board.id);
      const tasksData = await getKanbanTasks(board.id);
      console.log('📝 Tarefas carregadas:', tasksData.length);
      tasksData.forEach(task => console.log(`  - ${task.title} (Coluna: ${task.columnId})`));
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadArchivedTasks = async () => {
    if (!board) return;
    
    try {
      const archivedData = await getKanbanTasks(board.id, true);
      const filteredArchived = archivedData.filter(task => task.isArchived);
      setArchivedTasks(filteredArchived);
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
        dueDateFilter: (filters.dueDateFilter as 'overdue' | 'today' | 'week' | 'month') || undefined
      });
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error loading filtered tasks:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('🚀 Drag started:', active.id);
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      console.log('📝 Task found:', task.title);
      setActiveTask(task);
    } else {
      console.log('❌ Task not found for ID:', active.id);
      setActiveTask(null);
    }
  };

  const handleDragOver = () => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;
    
    // Snapshot para rollback confiável ANTES de qualquer mudança
    const snapshotTasks = [...tasks];
    
    // Find the task being dragged
    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask) {
      setActiveTask(null);
      return;
    }

    // Find the target column and position
    let targetColumnId: string;
    let newPosition: number = 0;
    
    // Check if dropping on a column
    const targetColumn = columns.find(c => c.id === overId);
    if (targetColumn) {
      targetColumnId = targetColumn.id;
      // Calculate position at end of column
      const columnTasks = tasks.filter(t => t.columnId === targetColumnId && t.id !== taskId);
      newPosition = columnTasks.length;
    } else {
      // Check if dropping on another task
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask) {
        targetColumnId = targetTask.columnId;
        // Calculate position before/after target task
        const columnTasks = tasks
          .filter(t => t.columnId === targetColumnId && t.id !== taskId)
          .sort((a, b) => a.position - b.position);
        const targetIndex = columnTasks.findIndex(t => t.id === targetTask.id);
        newPosition = targetIndex >= 0 ? targetIndex : columnTasks.length;
      } else {
        setActiveTask(null);
        return;
      }
    }

    // Update task position optimistically
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, columnId: targetColumnId, position: newPosition };
      }
      // Reordenar outras tarefas na coluna de destino
      if (task.columnId === targetColumnId && task.id !== taskId) {
        return { ...task, position: task.position >= newPosition ? task.position + 1 : task.position };
      }
      return task;
    });
    setTasks(updatedTasks);

    // Update in database
    try {
      await moveKanbanTask(taskId, targetColumnId, newPosition);
    } catch (error) {
      console.error('Error moving task:', error);
      // Rollback confiável usando snapshot
      setTasks(snapshotTasks);
      setActiveTask(null);
    }

    setActiveTask(null);
  };

  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task);
  };

  const handleTaskUpdate = (updatedTask: KanbanTask) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setSelectedTask(null);
  };

  const handleUnarchiveTask = async (taskId: string) => {
    try {
      const success = await updateKanbanTask(taskId, { isArchived: false });
      if (success) {
        // Recarregar tarefas normais e arquivadas
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
    setTasks(tasks.filter(task => task.id !== taskId));
    setSelectedTask(null);
  };

  const getTasksForColumn = (columnId: string) => {
    return tasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Erro ao carregar o quadro Kanban</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {board.name}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Settings size={16} />
            Filtros
          </button>
          <button
            onClick={() => {
              setShowArchived(!showArchived);
              if (!showArchived) {
                loadArchivedTasks();
              }
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {showArchived ? 'Ocultar Arquivados' : 'Ver Arquivados'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <KanbanFilters
          filters={filters}
          onFiltersChange={setFilters}
          columns={columns}
          onClose={() => setShowFilters(false)}
        />
      )}


      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max pb-4 h-full items-start">
            {columns.map(column => (
              <div key={column.id} className="flex-shrink-0 w-80 h-full">
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
              <div className="opacity-50 cursor-grabbing">
                {/* Preview inerte sem useSortable - apenas visual */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-600 transform rotate-2 scale-105">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {activeTask.title}
                  </h4>
                  {activeTask.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {activeTask.description}
                    </p>
                  )}
                  {/* Mostrar indicadores visuais básicos */}
                  {activeTask.priority && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {activeTask.priority === 'high' ? 'Alta' : activeTask.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <KanbanTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          boardId={board.id}
        />
      )}

      {/* Archived Tasks Modal */}
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
