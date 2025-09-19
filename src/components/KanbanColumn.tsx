import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnType, KanbanTask } from '../types';
import { KanbanTaskCard } from './KanbanTaskCard';
import { KanbanTaskModal } from './KanbanTaskModal';
import { Plus, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

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

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  // Função para obter cores baseadas na posição da coluna
  const getColumnColors = (position: number) => {
    const colors = [
      // Posição 0 - Coleta de assinaturas
      {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        header: 'bg-blue-100',
        text: 'text-blue-800',
        badge: 'bg-blue-200 text-blue-700'
      },
      // Posição 1 - Gravação de vídeo
      {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        header: 'bg-purple-100',
        text: 'text-purple-800',
        badge: 'bg-purple-200 text-purple-700'
      },
      // Posição 2 - Disparo de mensagem
      {
        bg: 'bg-green-50',
        border: 'border-green-200',
        header: 'bg-green-100',
        text: 'text-green-800',
        badge: 'bg-green-200 text-green-700'
      },
      // Posição 3 - Apresentar ao poder público
      {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        header: 'bg-orange-100',
        text: 'text-orange-800',
        badge: 'bg-orange-200 text-orange-700'
      },
      // Posição 4 - Aguardar retorno
      {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        header: 'bg-yellow-100',
        text: 'text-yellow-800',
        badge: 'bg-yellow-200 text-yellow-700'
      },
      // Posição 5 - Dar retorno à população
      {
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        header: 'bg-pink-100',
        text: 'text-pink-800',
        badge: 'bg-pink-200 text-pink-700'
      },
      // Posição 6 - Atividades extras
      {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        header: 'bg-indigo-100',
        text: 'text-indigo-800',
        badge: 'bg-indigo-200 text-indigo-700'
      }
    ];

    return colors[position] || colors[0];
  };

  const columnColors = getColumnColors(column.position);



  return (
    <div className={clsx(
      "rounded-lg p-4 min-h-[600px] border-2",
      // Modo claro: cores baseadas na posição
      columnColors.bg,
      columnColors.border,
      // Modo escuro: mantém o cinza
      "dark:bg-gray-800 dark:border-gray-700"
    )}>
      {/* Column Header */}
      <div className={clsx(
        "flex items-center justify-between mb-4 p-3 rounded-lg",
        // Modo claro: header colorido
        columnColors.header,
        // Modo escuro: mantém o cinza
        "dark:bg-gray-700"
      )}>
        <div className="flex items-center gap-2">
          <h3 className={clsx(
            "font-semibold",
            // Modo claro: texto colorido
            columnColors.text,
            // Modo escuro: mantém o branco
            "dark:text-white"
          )}>
            {column.name}
          </h3>
          <span className={clsx(
            "text-xs px-2 py-1 rounded-full",
            // Modo claro: badge colorido
            columnColors.badge,
            // Modo escuro: mantém o cinza
            "dark:bg-gray-600 dark:text-gray-300"
          )}>
            {tasks.length}
          </span>
        </div>
        
        <button className={clsx(
          "p-1 hover:bg-white/20 rounded",
          // Modo claro: ícone colorido
          columnColors.text,
          // Modo escuro: mantém o cinza
          "dark:text-gray-400 dark:hover:text-gray-300"
        )}>
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

      </div>
    </div>
  );
};
