import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnType, KanbanTask } from '../types';
import { KanbanTaskCard } from './KanbanTaskCard';
import { KanbanTaskModal } from './KanbanTaskModal';
import { createKanbanTask } from '../utils/kanban-storage';
import { Plus, MoreHorizontal } from 'lucide-react';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  onTaskCreate: (task: KanbanTask) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onTaskClick,
  onTaskCreate
}) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setIsCreating(true);
      const newTask = await createKanbanTask(
        column.boardId,
        column.id,
        newTaskTitle.trim()
      );

      if (newTask) {
        onTaskCreate(newTask);
        setNewTaskTitle('');
        setShowAddTask(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setShowAddTask(false);
      setNewTaskTitle('');
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[600px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {column.name}
          </h3>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className="space-y-3 min-h-[400px]"
      >
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {/* Add Task */}
        {showAddTask ? (
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Título da tarefa..."
              className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleAddTask}
                disabled={isCreating || !newTaskTitle.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Criando...' : 'Adicionar'}
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setNewTaskTitle('');
                }}
                className="px-3 py-1 text-gray-600 dark:text-gray-300 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddTask(true)}
            className="w-full flex items-center gap-2 p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm">Adicionar tarefa</span>
          </button>
        )}
      </div>
    </div>
  );
};
