import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  CheckSquare,
  Paperclip,
  Plus,
  Edit3,
  Trash2,
  Archive,
  ExternalLink
} from 'lucide-react';
import { KanbanTask, KanbanLabel, KanbanChecklist, KanbanChecklistItem, KanbanAttachment, KanbanComment } from '../types';
import { 
  updateKanbanTask, 
  assignUserToTask, 
  unassignUserFromTask,
  addLabelToTask,
  removeLabelFromTask,
  addCommentToTask,
  getKanbanComments,
  getKanbanLabels,
  createKanbanLabel,
  getAvailableUsers,
  createKanbanChecklist,
  getKanbanChecklists,
  createKanbanChecklistItem,
  toggleKanbanChecklistItem,
  deleteKanbanChecklistItem,
  deleteKanbanChecklist,
  addKanbanAttachment,
  getKanbanAttachments,
  deleteKanbanAttachment
} from '../utils/kanban-storage';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

interface KanbanTaskModalProps {
  task: KanbanTask;
  onClose: () => void;
  onUpdate: (task: KanbanTask) => void;
  boardId: string;
}

export const KanbanTaskModal: React.FC<KanbanTaskModalProps> = ({
  task,
  onClose,
  onUpdate,
  boardId
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  
  // Debug: Log do estado inicial da tarefa
  useEffect(() => {
    console.log('📋 Tarefa carregada:', {
      id: task.id,
      title: task.title,
      priority: task.priority,
      editedPriority: editedTask.priority
    });
  }, [task, editedTask.priority]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<KanbanLabel[]>([]);
  const [showLabelSelector, setShowLabelSelector] = useState(false);
  const [checklists, setChecklists] = useState<KanbanChecklist[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState<{ [checklistId: string]: string }>({});
  const [attachments, setAttachments] = useState<KanbanAttachment[]>([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; email: string; name?: string }[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [comments, setComments] = useState<KanbanComment[]>([]);

  useEffect(() => {
    loadLabels();
    loadChecklists();
    loadAttachments();
    loadAvailableUsers();
    loadComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, editedTask.id]);

  const loadLabels = async () => {
    try {
      const labels = await getKanbanLabels(boardId);
      setAvailableLabels(labels);
    } catch (error) {
      console.error('Error loading labels:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const users = await getAvailableUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const loadComments = async () => {
    try {
      const taskComments = await getKanbanComments(editedTask.id);
      setComments(taskComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadChecklists = async () => {
    try {
      const taskChecklists = await getKanbanChecklists(editedTask.id);
      setChecklists(taskChecklists);
    } catch (error) {
      console.error('Error loading checklists:', error);
    }
  };

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) return;

    try {
      const checklist = await createKanbanChecklist(editedTask.id, newChecklistTitle.trim());
      if (checklist) {
        setChecklists([...checklists, checklist]);
        setNewChecklistTitle('');
        setShowAddChecklist(false);
      }
    } catch (error) {
      console.error('Error creating checklist:', error);
    }
  };

  const handleCreateChecklistItem = async (checklistId: string) => {
    const itemText = newChecklistItem[checklistId];
    if (!itemText?.trim()) return;

    try {
      const item = await createKanbanChecklistItem(checklistId, itemText.trim());
      if (item) {
        setChecklists(checklists.map(checklist => 
          checklist.id === checklistId 
            ? { ...checklist, items: [...(checklist.items || []), item] }
            : checklist
        ));
        setNewChecklistItem({ ...newChecklistItem, [checklistId]: '' });
      }
    } catch (error) {
      console.error('Error creating checklist item:', error);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    try {
      const success = await toggleKanbanChecklistItem(itemId, isCompleted);
      if (success) {
        setChecklists(checklists.map(checklist => ({
          ...checklist,
          items: checklist.items?.map(item => 
            item.id === itemId ? { ...item, isCompleted } : item
          ) || []
        })));
      }
    } catch (error) {
      console.error('Error toggling checklist item:', error);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string, checklistId: string) => {
    try {
      const success = await deleteKanbanChecklistItem(itemId);
      if (success) {
        setChecklists(checklists.map(checklist => 
          checklist.id === checklistId 
            ? { ...checklist, items: checklist.items?.filter(item => item.id !== itemId) || [] }
            : checklist
        ));
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      const success = await deleteKanbanChecklist(checklistId);
      if (success) {
        setChecklists(checklists.filter(checklist => checklist.id !== checklistId));
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  const loadAttachments = async () => {
    try {
      const taskAttachments = await getKanbanAttachments(editedTask.id);
      setAttachments(taskAttachments);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const handleAddAttachment = async () => {
    if (!newAttachmentUrl.trim()) return;

    try {
      const attachment = await addKanbanAttachment(
        editedTask.id, 
        'link', 
        newAttachmentUrl.trim(), 
        newAttachmentName.trim() || undefined
      );
      if (attachment) {
        setAttachments([...attachments, attachment]);
        setNewAttachmentUrl('');
        setNewAttachmentName('');
        setShowAddAttachment(false);
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const success = await deleteKanbanAttachment(attachmentId);
      if (success) {
        setAttachments(attachments.filter(attachment => attachment.id !== attachmentId));
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
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
        setComments([...comments, comment]);
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

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;

    try {
      const label = await createKanbanLabel(boardId, newLabelName.trim(), newLabelColor);
      if (label) {
        setAvailableLabels([...availableLabels, label]);
        setNewLabelName('');
        setShowCreateLabel(false);
      }
    } catch (error) {
      console.error('Error creating label:', error);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setNewComment(value);
    
    // Verificar se há @ antes do cursor
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Se não há espaço após o @, mostrar sugestões
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentionSuggestions(true);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleMentionSelect = (user: { id: string; email: string; name?: string }) => {
    const beforeMention = newComment.substring(0, mentionPosition);
    const afterMention = newComment.substring(mentionPosition + 1 + mentionQuery.length);
    const mentionText = `@${user.name || user.email} `;
    
    const newText = beforeMention + mentionText + afterMention;
    setNewComment(newText);
    setShowMentionSuggestions(false);
    setMentionQuery('');
  };

  const getFilteredUsers = () => {
    if (!mentionQuery) return availableUsers;
    return availableUsers.filter(user => 
      (user.name?.toLowerCase().includes(mentionQuery.toLowerCase()) || 
       user.email.toLowerCase().includes(mentionQuery.toLowerCase())) &&
      !editedTask.assignees?.some(assignee => assignee.userId === user.id)
    );
  };

  const renderCommentWithMentions = (content: string) => {
    // Regex para encontrar menções @usuario
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // É uma menção
        const mentionedUser = availableUsers.find(user => 
          (user.name?.toLowerCase() === part.toLowerCase()) || 
          (user.email.toLowerCase() === part.toLowerCase())
        );
        
        if (mentionedUser) {
          return (
            <span 
              key={index} 
              className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1 rounded text-sm font-medium"
            >
              @{mentionedUser.name || mentionedUser.email}
            </span>
          );
        }
        return <span key={index}>@{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleArchive = async () => {
    try {
      const success = await updateKanbanTask(editedTask.id, { isArchived: true });
      if (success) {
        onUpdate({ ...editedTask, isArchived: true });
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

              {/* Botão para acessar abaixo-assinado - Acima do Checklist */}
              {editedTask.petitionId && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      navigate(`/petitions/${editedTask.petitionId}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    title="Acessar abaixo-assinado completo"
                  >
                    <ExternalLink size={16} />
                    Acessar Abaixo-Assinado
                  </button>
                </div>
              )}

              {/* Checklist */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Checklist
                </h3>
                
                {/* Lista de Checklists */}
                <div className="space-y-4 mb-4">
                  {checklists.map(checklist => {
                    const completedItems = checklist.items?.filter((item: KanbanChecklistItem) => item.isCompleted).length || 0;
                    const totalItems = checklist.items?.length || 0;
                    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                    
                    return (
                      <div key={checklist.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        {/* Header do Checklist */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CheckSquare size={16} className="text-blue-600" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {checklist.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteChecklist(checklist.id)}
                            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {/* Barra de Progresso */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {progressPercentage}%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {completedItems}/{totalItems}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Itens do Checklist */}
                        <div className="space-y-2">
                          {checklist.items?.map((item: KanbanChecklistItem) => (
                            <div key={item.id} className="flex items-center gap-3 group">
                              <input
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <span className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {item.text}
                              </span>
                              <button
                                onClick={() => handleDeleteChecklistItem(item.id, checklist.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Adicionar Item ao Checklist */}
                        <div className="mt-3">
                          <input
                            type="text"
                            value={newChecklistItem[checklist.id] || ''}
                            onChange={(e) => setNewChecklistItem({ 
                              ...newChecklistItem, 
                              [checklist.id]: e.target.value 
                            })}
                            placeholder="Adicionar um item"
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateChecklistItem(checklist.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Botão Adicionar Checklist */}
                {showAddChecklist ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <input
                      type="text"
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      placeholder="Título do checklist..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateChecklist()}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateChecklist}
                        disabled={!newChecklistTitle.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Criar Checklist
                      </button>
                      <button
                        onClick={() => {
                          setShowAddChecklist(false);
                          setNewChecklistTitle('');
                        }}
                        className="px-3 py-1 text-gray-600 dark:text-gray-300 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddChecklist(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus size={14} />
                    Adicionar Checklist
                  </button>
                )}
              </div>

              {/* Attachments */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Anexos ({attachments.length})
                </h3>
                
                {/* Lista de Anexos */}
                <div className="space-y-2 mb-4">
                  {attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Paperclip size={16} className="text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {attachment.fileName}
                          </span>
                          {attachment.type === 'link' && (
                            <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                              Link
                            </span>
                          )}
                        </div>
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate block"
                        >
                          {attachment.url}
                        </a>
                      </div>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Botão Adicionar Anexo */}
                {showAddAttachment ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome do Anexo (opcional)
                        </label>
                        <input
                          type="text"
                          value={newAttachmentName}
                          onChange={(e) => setNewAttachmentName(e.target.value)}
                          placeholder="Ex: Documento do Google Drive"
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          URL do Link *
                        </label>
                        <input
                          type="url"
                          value={newAttachmentUrl}
                          onChange={(e) => setNewAttachmentUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddAttachment()}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleAddAttachment}
                        disabled={!newAttachmentUrl.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Adicionar Anexo
                      </button>
                      <button
                        onClick={() => {
                          setShowAddAttachment(false);
                          setNewAttachmentUrl('');
                          setNewAttachmentName('');
                        }}
                        className="px-3 py-1 text-gray-600 dark:text-gray-300 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddAttachment(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus size={14} />
                    Adicionar Anexo
                  </button>
                )}
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Comentários ({comments.length})
                </h3>
                
                <div className="space-y-3 mb-4">
                  {comments.map(comment => (
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
                        {renderCommentWithMentions(comment.content)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newComment}
                        onChange={handleCommentChange}
                        placeholder="Adicionar comentário... (use @ para mencionar)"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowMentionSuggestions(false);
                          }
                        }}
                      />
                      
                      {/* Sugestões de Menção */}
                      {showMentionSuggestions && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                          {getFilteredUsers().length > 0 ? (
                            getFilteredUsers().map(user => (
                              <button
                                key={user.id}
                                onClick={() => handleMentionSelect(user)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                              >
                                <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                  {user.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {user.name || user.email}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {user.email}
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                              Nenhum usuário encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Due Date */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Prazo
                </h3>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={editedTask.dueDate ? 
                      new Date(editedTask.dueDate).toLocaleDateString('en-CA') : ''}
                    onChange={async (e) => {
                      const newDueDate = e.target.value ? 
                        new Date(e.target.value + 'T23:59:59') : undefined;
                      setEditedTask({ 
                        ...editedTask, 
                        dueDate: newDueDate 
                      });
                      
                      // Salvar automaticamente quando o prazo for alterado
                      try {
                        await updateKanbanTask(editedTask.id, { dueDate: newDueDate });
                      } catch (error) {
                        console.error('Error updating due date:', error);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  {editedTask.dueDate && (
                    <div className={clsx(
                      'flex items-center gap-2 text-sm',
                      isOverdue ? 'text-red-600 dark:text-red-400' : 
                      isDueToday ? 'text-yellow-600 dark:text-yellow-400' : 
                      'text-gray-500 dark:text-gray-400'
                    )}>
                      <Calendar size={16} />
                      <span>
                        {isOverdue ? 'Vencido em ' : isDueToday ? 'Vence hoje em ' : 'Vence em '}
                        {new Date(editedTask.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
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
                  
                  {showUserSelector ? (
                    <div className="space-y-2">
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {availableUsers
                          .filter(user => !editedTask.assignees?.some(assignee => assignee.userId === user.id))
                          .map(user => (
                            <button
                              key={user.id}
                              onClick={() => {
                                handleAssignUser(user.id);
                                setShowUserSelector(false);
                              }}
                              className="flex items-center gap-2 w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                            >
                              <div className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                              <span>{user.name || user.email}</span>
                            </button>
                          ))}
                      </div>
                      <button
                        onClick={() => setShowUserSelector(false)}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowUserSelector(true)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Plus size={14} />
                      Adicionar responsável
                    </button>
                  )}
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
                  <div className="mt-2 space-y-2">
                    <div className="max-h-32 overflow-y-auto space-y-1">
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
                    
                    {showCreateLabel ? (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
                        <input
                          type="text"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder="Nome da etiqueta..."
                          className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                            className="w-8 h-6 border border-gray-200 dark:border-gray-600 rounded cursor-pointer"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Cor</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateLabel}
                            disabled={!newLabelName.trim()}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Criar
                          </button>
                          <button
                            onClick={() => {
                              setShowCreateLabel(false);
                              setNewLabelName('');
                            }}
                            className="px-2 py-1 text-gray-600 dark:text-gray-300 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCreateLabel(true)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Plus size={14} />
                        Criar nova etiqueta
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowLabelSelector(false)}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Prioridade
                </h3>
                <select
                  value={editedTask.priority || 'medium'}
                  onChange={async (e) => {
                    console.log('🔄 Prioridade alterada:', e.target.value);
                    const newPriority = e.target.value as 'low' | 'medium' | 'high';
                    setEditedTask({ 
                      ...editedTask, 
                      priority: newPriority 
                    });
                    
                    // Salvar automaticamente quando a prioridade for alterada
                    try {
                      console.log('💾 Salvando prioridade:', newPriority);
                      await updateKanbanTask(editedTask.id, { priority: newPriority });
                      console.log('✅ Prioridade salva com sucesso');
                    } catch (error) {
                      console.error('❌ Error updating priority:', error);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ zIndex: 1000 }}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
