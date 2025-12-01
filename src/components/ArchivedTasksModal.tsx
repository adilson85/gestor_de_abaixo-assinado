import React, { useState } from 'react';
import { X, Search, ArchiveRestore, Trash2, Calendar } from 'lucide-react';
import { KanbanTask } from '../types';
import { updateKanbanTask, deleteKanbanTask } from '../utils/kanban-storage';

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
  onTaskDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrar tarefas por termo de busca
  const filteredTasks = archivedTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Agrupar tarefas por data de arquivamento
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Itens arquivados ({archivedTasks.length})
            </h2>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Pesquisar arquivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {viewMode === 'grid' ? 'Alternar para listas' : 'Alternar para grade'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="text-center py-12">
              <ArchiveRestore size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item arquivado'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([groupName, tasks]) => (
                <div key={groupName}>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {groupName}
                  </h3>
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                    : 'space-y-2'
                  }>
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className={`bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedTask?.id === task.id 
                            ? 'ring-2 ring-blue-500 border-blue-500' 
                            : 'hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <h4 className="font-medium text-gray-900 dark:text-white line-through">
                              {task.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                              Arquivado
                            </span>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-through mb-3">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar size={12} />
                            <span>
                              Arquivado em {new Date(task.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          
                          {selectedTask?.id === task.id && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnarchive(task.id);
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                <ArchiveRestore size={14} />
                                Restaurar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task.id);
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          )}
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

