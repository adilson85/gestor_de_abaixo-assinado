import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple';
  description?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  description
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 dark:bg-blue-400 dark:text-blue-300',
    green: 'bg-green-500 text-green-600 dark:bg-green-400 dark:text-green-300',
    orange: 'bg-orange-500 text-orange-600 dark:bg-orange-400 dark:text-orange-300',
    purple: 'bg-purple-500 text-purple-600 dark:bg-purple-400 dark:text-purple-300',
  } as const;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2 dark:text-white">{value.toLocaleString('pt-BR')}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${colorClasses[color].split(' ')[0]} bg-opacity-10`}>
          <Icon size={24} className={colorClasses[color].split(' ')[1]} />
        </div>
      </div>
    </div>
  );
};