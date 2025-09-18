import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnType, KanbanTask, KanbanBoard } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';
import { KanbanFilters } from './KanbanFilters';
import { KanbanTaskModal } from './KanbanTaskModal';
import { 
  getGlobalKanbanBoard, 
  getKanbanColumns, 
  getKanbanTasks, 
  moveKanbanTask,
  searchKanbanTasks 
} from '../utils/kanban-storage';
import { Plus, Settings } from 'lucide-react';

interface KanbanBoardProps {
  petitionId?: string; // Opcional para filtrar tarefas por abaixo-assinado
}

export const KanbanBoardComponent: React.FC<KanbanBoardProps> = ({ petitionId }) => {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    assigneeId: '',
    labelId: '',
    columnId: '',
    priority: '',
    dueDateFilter: ''
  });

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
      const tasksData = await getKanbanTasks(board.id);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
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
        dueDateFilter: filters.dueDateFilter as any || undefined
      });
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error loading filtered tasks:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
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
    
    // Find the task being dragged
    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask) return;

    // Find the target column
    let targetColumnId: string;
    
    // Check if dropping on a column
    const targetColumn = columns.find(c => c.id === overId);
    if (targetColumn) {
      targetColumnId = targetColumn.id;
    } else {
      // Check if dropping on another task
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask) {
        targetColumnId = targetTask.columnId;
      } else {
        setActiveTask(null);
        return;
      }
    }

    // Update task position optimistically
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, columnId: targetColumnId };
      }
      return task;
    });
    setTasks(updatedTasks);

    // Update in database
    try {
      await moveKanbanTask(taskId, targetColumnId, 0);
    } catch (error) {
      console.error('Error moving task:', error);
      // Revert optimistic update
      setTasks(tasks);
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
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Organize as tarefas do abaixo-assinado
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Settings size={16} />
            Filtros
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
      <div className="flex-1 overflow-x-auto">
        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max pb-4">
            {columns.map(column => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <SortableContext
                  items={getTasksForColumn(column.id).map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn
                    column={column}
                    tasks={getTasksForColumn(column.id)}
                    onTaskClick={handleTaskClick}
                    onTaskCreate={handleTaskCreate}
                  />
                </SortableContext>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-50">
                <KanbanTaskCard
                  task={activeTask}
                  onClick={() => {}}
                />
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
    </div>
  );
};
