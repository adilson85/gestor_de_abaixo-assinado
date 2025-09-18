import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  Tag, 
  CheckSquare, 
  Paperclip, 
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  Archive
} from 'lucide-react';
import { KanbanTask, KanbanLabel, KanbanChecklistItem } from '../types';
import { 
  updateKanbanTask, 
  assignUserToTask, 
  unassignUserFromTask,
  addLabelToTask,
  removeLabelFromTask,
  addCommentToTask,
  getKanbanLabels
} from '../utils/kanban-storage';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

interface KanbanTaskModalProps {
  task: KanbanTask;
  onClose: () => void;
  onUpdate: (task: KanbanTask) => void;
  onDelete: (taskId: string) => void;
  boardId: string;
}

export const KanbanTaskModal: React.FC<KanbanTaskModalProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  boardId
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<KanbanLabel[]>([]);
  const [showLabelSelector, setShowLabelSelector] = useState(false);

  useEffect(() => {
    loadLabels();
  }, [boardId]);

  const loadLabels = async () => {
    try {
      const labels = await getKanbanLabels(boardId);
      setAvailableLabels(labels);
    } catch (error) {
      console.error('Error loading labels:', error);
    }
  };

  const handleSave = async () => {
    try {
      const success = await updateKanbanTask(editedTask.id, {
        title: editedTask.title,
        description: editedTask.description,
        priority: editedTask.priority,
        dueDate: editedTask.dueDate
      });

      if (success) {
        onUpdate(editedTask);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsAddingComment(true);
      const comment = await addCommentToTask(editedTask.id, newComment.trim());
      
      if (comment) {
        setEditedTask({
          ...editedTask,
          comments: [...(editedTask.comments || []), comment]
        });
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      const success = await assignUserToTask(editedTask.id, userId);
      if (success) {
        // Update local state
        const updatedAssignees = [...(editedTask.assignees || []), {
          id: `temp-${Date.now()}`,
          taskId: editedTask.id,
          userId,
          assignedAt: new Date(),
          user: { id: userId, email: 'Usuário' } // TODO: Get actual user data
        }];
        setEditedTask({ ...editedTask, assignees: updatedAssignees });
      }
    } catch (error) {
      console.error('Error assigning user:', error);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    try {
      const success = await unassignUserFromTask(editedTask.id, userId);
      if (success) {
        const updatedAssignees = editedTask.assignees?.filter(a => a.userId !== userId) || [];
        setEditedTask({ ...editedTask, assignees: updatedAssignees });
      }
    } catch (error) {
      console.error('Error unassigning user:', error);
    }
  };

  const handleAddLabel = async (labelId: string) => {
    try {
      const success = await addLabelToTask(editedTask.id, labelId);
      if (success) {
        const label = availableLabels.find(l => l.id === labelId);
        if (label) {
          const updatedLabels = [...(editedTask.labels || []), {
            id: `temp-${Date.now()}`,
            taskId: editedTask.id,
            labelId,
            label
          }];
          setEditedTask({ ...editedTask, labels: updatedLabels });
        }
      }
    } catch (error) {
      console.error('Error adding label:', error);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      const success = await removeLabelFromTask(editedTask.id, labelId);
      if (success) {
        const updatedLabels = editedTask.labels?.filter(l => l.labelId !== labelId) || [];
        setEditedTask({ ...editedTask, labels: updatedLabels });
      }
    } catch (error) {
      console.error('Error removing label:', error);
    }
  };

  const handleArchive = async () => {
    try {
      const success = await updateKanbanTask(editedTask.id, { isArchived: true });
      if (success) {
        onDelete(editedTask.id);
        onClose();
      }
    } catch (error) {
      console.error('Error archiving task:', error);
    }
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

  const isOverdue = editedTask.dueDate && new Date(editedTask.dueDate) < new Date();
  const isDueToday = editedTask.dueDate && 
    new Date(editedTask.dueDate).toDateString() === new Date().toDateString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                autoFocus
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editedTask.title}
              </h2>
            )}
            
            {editedTask.priority && (
              <span className={clsx(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                getPriorityColor(editedTask.priority)
              )}>
                {editedTask.priority === 'high' ? 'Alta' : editedTask.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTask(task);
                  }}
                  className="px-3 py-1 text-gray-600 dark:text-gray-300 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={handleArchive}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Archive size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Descrição
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    placeholder="Adicione uma descrição..."
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    {editedTask.description || 'Sem descrição'}
                  </p>
                )}
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Comentários ({editedTask.comments?.length || 0})
                </h3>
                
                <div className="space-y-3 mb-4">
                  {editedTask.comments?.map(comment => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.author?.email || 'Usuário'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicionar comentário..."
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={isAddingComment || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingComment ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Due Date */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Prazo
                </h3>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditedTask({ 
                      ...editedTask, 
                      dueDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className={clsx(
                    'flex items-center gap-2 text-sm',
                    isOverdue ? 'text-red-600 dark:text-red-400' : 
                    isDueToday ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-gray-500 dark:text-gray-400'
                  )}>
                    <Calendar size={16} />
                    {editedTask.dueDate ? (
                      <span>
                        {isOverdue ? 'Vencido em ' : isDueToday ? 'Vence hoje em ' : 'Vence em '}
                        {new Date(editedTask.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span>Sem prazo</span>
                    )}
                  </div>
                )}
              </div>

              {/* Assignees */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Responsáveis
                </h3>
                <div className="space-y-2">
                  {editedTask.assignees?.map(assignee => (
                    <div key={assignee.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                          {assignee.user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {assignee.user?.email}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUnassignUser(assignee.userId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
                    <Plus size={14} />
                    Adicionar responsável
                  </button>
                </div>
              </div>

              {/* Labels */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Etiquetas
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedTask.labels?.map(taskLabel => (
                    <div
                      key={taskLabel.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: taskLabel.label?.color + '20',
                        color: taskLabel.label?.color 
                      }}
                    >
                      <span>{taskLabel.label?.name}</span>
                      <button
                        onClick={() => handleRemoveLabel(taskLabel.labelId)}
                        className="hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowLabelSelector(!showLabelSelector)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus size={14} />
                  Adicionar etiqueta
                </button>

                {showLabelSelector && (
                  <div className="mt-2 space-y-1">
                    {availableLabels
                      .filter(label => !editedTask.labels?.some(taskLabel => taskLabel.labelId === label.id))
                      .map(label => (
                        <button
                          key={label.id}
                          onClick={() => {
                            handleAddLabel(label.id);
                            setShowLabelSelector(false);
                          }}
                          className="flex items-center gap-2 w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span>{label.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Priority */}
              {isEditing && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Prioridade
                  </h3>
                  <select
                    value={editedTask.priority}
                    onChange={(e) => setEditedTask({ 
                      ...editedTask, 
                      priority: e.target.value as 'low' | 'medium' | 'high' 
                    })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
