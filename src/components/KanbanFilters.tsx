import React from 'react';
import { KanbanColumn } from '../types';
import { X, Search, Filter } from 'lucide-react';

interface KanbanFiltersProps {
  filters: {
    searchTerm: string;
    assigneeId: string;
    labelId: string;
    columnId: string;
    priority: string;
    dueDateFilter: string;
  };
  onFiltersChange: (filters: any) => void;
  columns: KanbanColumn[];
  onClose: () => void;
}

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  filters,
  onFiltersChange,
  columns,
  onClose
}) => {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      assigneeId: '',
      labelId: '',
      columnId: '',
      priority: '',
      dueDateFilter: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-600 dark:text-gray-300" />
          <h3 className="font-medium text-gray-900 dark:text-white">Filtros</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Column Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Coluna
          </label>
          <select
            value={filters.columnId}
            onChange={(e) => handleFilterChange('columnId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as colunas</option>
            {columns.map(column => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prioridade
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prazo
          </label>
          <select
            value={filters.dueDateFilter}
            onChange={(e) => handleFilterChange('dueDateFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os prazos</option>
            <option value="overdue">Vencidos</option>
            <option value="today">Vence hoje</option>
            <option value="week">Vence esta semana</option>
            <option value="month">Vence este mês</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Responsável
          </label>
          <select
            value={filters.assigneeId}
            onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os responsáveis</option>
            {/* TODO: Load users from context or API */}
            <option value="me">Atribuído a mim</option>
            <option value="unassigned">Sem responsável</option>
          </select>
        </div>

        {/* Label Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Etiqueta
          </label>
          <select
            value={filters.labelId}
            onChange={(e) => handleFilterChange('labelId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as etiquetas</option>
            {/* TODO: Load labels from board */}
          </select>
        </div>
      </div>
    </div>
  );
};
