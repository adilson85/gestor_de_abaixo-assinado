import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: React.ReactNode;
  placeholder?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  placeholder = 'Buscar...'
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300 dark:border-gray-600"
          />
        </div>
        
        {filters && (
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400 dark:text-gray-300" />
            {filters}
          </div>
        )}
      </div>
    </div>
  );
};