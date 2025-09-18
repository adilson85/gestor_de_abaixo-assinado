import React from 'react';
import { KanbanBoardComponent } from '../components/KanbanBoard';

export const Tasks: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tarefas</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-300">Gerencie as tarefas dos abaixo-assinados</p>
          </div>
        </div>
      </div>

      <KanbanBoardComponent />
    </div>
  );
};
