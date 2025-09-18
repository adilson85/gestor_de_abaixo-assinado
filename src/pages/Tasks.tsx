import React from 'react';

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

      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Sistema Kanban em Desenvolvimento
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          O sistema de tarefas Kanban está sendo implementado. Em breve você poderá gerenciar todas as tarefas dos abaixo-assinados aqui.
        </p>
      </div>
    </div>
  );
};
