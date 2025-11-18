import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanTask } from '../types';
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  Paperclip, 
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import clsx from 'clsx';

interface KanbanTaskCardProps {
  task: KanbanTask;
  onClick: () => void;
}

export const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({ task, onClick }) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle size={12} />;
      case 'medium':
        return <Clock size={12} />;
      case 'low':
        return <CheckCircle size={12} />;
      default:
        return null;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isDueToday = task.dueDate && 
    new Date(task.dueDate).toDateString() === new Date().toDateString();

  const getDueDateColor = () => {
    if (isOverdue) return 'text-red-600 dark:text-red-400';
    if (isDueToday) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getDueDateIcon = () => {
    if (isOverdue) return <AlertCircle size={12} />;
    if (isDueToday) return <Clock size={12} />;
    return <Calendar size={12} />;
  };

  const completedChecklistItems = task.checklists?.reduce((total, checklist) => 
    total + (checklist.items?.filter(item => item.isCompleted).length || 0), 0
  ) || 0;

  const totalChecklistItems = task.checklists?.reduce((total, checklist) => 
    total + (checklist.items?.length || 0), 0
  ) || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white dark:bg-gray-700 rounded-lg p-3 cursor-pointer transition-all duration-200',
        // Sombreado melhorado
        'shadow-md hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20',
        // Borda sutil
        'border border-gray-200/60 dark:border-gray-600/60',
        // Efeitos de hover
        'hover:scale-[1.02] hover:-translate-y-0.5',
        // Estado de arrastar
        isDragging && 'opacity-50 rotate-2 scale-105 shadow-2xl'
      )}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isDragging) {
          return;
        }
        onClick();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (!isDragging) {
            onClick();
          }
        }
      }}
    >
      <div className="absolute top-2 right-2 w-6 h-6 cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-all duration-200 z-30 pointer-events-none">
        <div className="w-full h-full bg-blue-100 dark:bg-blue-800 rounded-md shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-200">
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-blue-500 dark:bg-blue-300 rounded-full"></div>
            <div className="w-1 h-1 bg-blue-500 dark:bg-blue-300 rounded-full"></div>
            <div className="w-1 h-1 bg-blue-500 dark:bg-blue-300 rounded-full"></div>
          </div>
        </div>
      </div>
      {/* Priority and Labels */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {task.priority && (
            <span className={clsx(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm',
              getPriorityColor(task.priority)
            )}>
              {getPriorityIcon(task.priority)}
              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
            </span>
          )}
        </div>
        
        {task.labels && task.labels.length > 0 && (
          <div className="flex gap-1">
            {task.labels.slice(0, 3).map((taskLabel) => (
              <div
                key={taskLabel.id}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: taskLabel.label?.color || '#3B82F6' }}
                title={taskLabel.label?.name}
              />
            ))}
            {task.labels.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Botão para acessar abaixo-assinado - Dentro do card */}
      {task.petitionId && (
        <div className="mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/petitions/${task.petitionId}`);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
            title="Acessar abaixo-assinado completo"
          >
            <ExternalLink size={14} />
            Acessar Abaixo-Assinado
          </button>
        </div>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div className={clsx(
          'flex items-center gap-1 text-xs mb-2',
          getDueDateColor()
        )}>
          {getDueDateIcon()}
          <span>
            {isOverdue ? 'Vencido' : isDueToday ? 'Hoje' : 'Vence'} em{' '}
            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Assignees */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center gap-1">
              <Users size={12} className="text-gray-400" />
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm"
                    title={assignee.user?.email}
                  >
                    {assignee.user?.email?.charAt(0).toUpperCase()}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checklist Progress */}
          {totalChecklistItems > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completedChecklistItems}/{totalChecklistItems}
              </span>
            </div>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.attachments.length}
              </span>
            </div>
          )}

          {/* Comments */}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.comments.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
