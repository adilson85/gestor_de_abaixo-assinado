import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import { KanbanColumn } from '../types';

export interface KanbanFiltersType {
  searchTerm: string;
  assigneeId: string;
  labelId: string;
  columnId: string;
  priority: string;
  dueDateFilter: string;
}

interface KanbanFiltersProps {
  filters: KanbanFiltersType;
  onFiltersChange: (filters: KanbanFiltersType) => void;
  columns: KanbanColumn[];
  onClose: () => void;
}

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  filters,
  onFiltersChange,
  columns,
  onClose,
}) => {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      assigneeId: '',
      labelId: '',
      columnId: '',
      priority: '',
      dueDateFilter: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value && value !== '');

  return (
    <div className="mb-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
            <Filter size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Refine o quadro</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Filtre por coluna, prioridade, prazo ou responsáveis para focar no que precisa de ação.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/30 dark:hover:text-blue-300"
            >
              Limpar filtros
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Buscar</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Etapa</label>
          <select
            value={filters.columnId}
            onChange={(e) => handleFilterChange('columnId', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
          >
            <option value="">Todas as colunas</option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridade</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
          >
            <option value="">Todas as prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prazo</label>
          <select
            value={filters.dueDateFilter}
            onChange={(e) => handleFilterChange('dueDateFilter', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
          >
            <option value="">Todos os prazos</option>
            <option value="overdue">Vencidos</option>
            <option value="today">Vence hoje</option>
            <option value="week">Vence esta semana</option>
            <option value="month">Vence este mês</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Responsável</label>
          <select
            value={filters.assigneeId}
            onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
          >
            <option value="">Todos os responsáveis</option>
            <option value="me">Atribuído a mim</option>
            <option value="unassigned">Sem responsável</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Etiqueta</label>
          <select
            value={filters.labelId}
            onChange={(e) => handleFilterChange('labelId', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
          >
            <option value="">Todas as etiquetas</option>
          </select>
        </div>
      </div>
    </div>
  );
};
