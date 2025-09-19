import React from 'react';
import { KanbanBoardComponent } from '../components/KanbanBoard';

export const Tasks: React.FC = () => {
  return (
    <div className="h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tarefas Globais</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-300">Organize as tarefas do abaixo-assinado</p>
          </div>
        </div>
      </div>

      <div className="h-full">
        <KanbanBoardComponent />
      </div>
    </div>
  );
};
