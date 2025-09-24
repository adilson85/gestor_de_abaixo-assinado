import { supabase } from '../lib/supabase';
import { 
  KanbanBoard, 
  KanbanColumn, 
  KanbanTask, 
  KanbanTaskAssignee,
  KanbanLabel,
  KanbanTaskLabel,
  KanbanChecklist,
  KanbanChecklistItem,
  KanbanAttachment,
  KanbanComment,
  KanbanActivity
} from '../types';

// ===== BOARD FUNCTIONS =====

export const getGlobalKanbanBoard = async (): Promise<KanbanBoard | null> => {
  const { data, error } = await supabase
    .from('kanban_boards')
    .select('*')
    .eq('is_global', true)
    .limit(1)
    .single();

  if (error) {
    console.error('Error getting global kanban board:', error);
    return null;
  }

  return {
    id: data.id,
    petitionId: '', // Board global não tem petition_id
    name: data.name,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
};

// ===== COLUMN FUNCTIONS =====

export const getKanbanColumns = async (boardId: string): Promise<KanbanColumn[]> => {
  const { data, error } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position');

  if (error) {
    console.error('Error getting kanban columns:', error);
    return [];
  }

  return data.map(col => ({
    id: col.id,
    boardId: col.board_id,
    name: col.name,
    position: col.position,
    isActive: col.is_active || true, // Valor padrão se não existir
    createdAt: new Date(col.created_at),
    updatedAt: new Date(col.updated_at)
  }));
};

export const createKanbanColumn = async (boardId: string, name: string, position: number): Promise<KanbanColumn | null> => {
  const { data, error } = await supabase
    .from('kanban_columns')
    .insert({
      board_id: boardId,
      name,
      position
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating kanban column:', error);
    return null;
  }

  return {
    id: data.id,
    boardId: data.board_id,
    name: data.name,
    position: data.position,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
};

export const updateKanbanColumn = async (columnId: string, updates: { name?: string; position?: number }): Promise<boolean> => {
  const { error } = await supabase
    .from('kanban_columns')
    .update(updates)
    .eq('id', columnId);

  if (error) {
    console.error('Error updating kanban column:', error);
    return false;
  }

  return true;
};

export const deleteKanbanColumn = async (columnId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('kanban_columns')
    .update({ is_active: false })
    .eq('id', columnId);

  if (error) {
    console.error('Error deleting kanban column:', error);
    return false;
  }

  return true;
};

export const deleteKanbanTask = async (taskId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('kanban_tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting kanban task:', error);
    return false;
  }

  return true;
};

// ===== TASK FUNCTIONS =====

export const getKanbanTasks = async (boardId: string, includeArchived: boolean = false): Promise<KanbanTask[]> => {
  // Buscar tarefas do board específico (agora compatível com local e online)
  let query = supabase
    .from('kanban_tasks')
    .select('*');

  // Filtrar por board_id apenas se as tarefas tiverem esse campo
  // Para compatibilidade, vamos buscar todas e filtrar no código se necessário

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query.order('position', { ascending: true });

  if (error) {
    console.error('Error getting kanban tasks:', error);
    return [];
  }

  return data.map(task => ({
    id: task.id,
    boardId: task.board_id || boardId,
    columnId: task.column_id,
    title: task.title,
    description: task.description,
    priority: task.priority || 'medium',
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    position: task.position,
    isArchived: task.is_archived,
    createdBy: task.created_by || 'unknown',
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
    assignees: task.kanban_task_assignees?.map((assignee: any) => ({
      id: assignee.id,
      taskId: task.id,
      userId: assignee.user_id,
      assignedAt: new Date(assignee.assigned_at),
      user: assignee.user
    })) || [],
    labels: task.kanban_task_labels?.map((taskLabel: any) => ({
      id: taskLabel.id,
      taskId: task.id,
      labelId: taskLabel.label_id,
      label: taskLabel.label
    })) || [],
    checklists: task.kanban_checklists?.map((checklist: any) => ({
      id: checklist.id,
      taskId: task.id,
      title: checklist.title,
      position: checklist.position,
      createdAt: new Date(checklist.created_at),
      items: checklist.items?.map((item: any) => ({
        id: item.id,
        checklistId: checklist.id,
        text: item.text,
        isCompleted: item.is_completed,
        position: item.position,
        createdAt: new Date(item.created_at)
      })) || []
    })) || [],
    attachments: task.kanban_attachments?.map((attachment: any) => ({
      id: attachment.id,
      taskId: task.id,
      type: attachment.type,
      url: attachment.url,
      fileName: attachment.file_name,
      fileSize: attachment.file_size,
      mimeType: attachment.mime_type,
      createdBy: attachment.created_by,
      createdAt: new Date(attachment.created_at)
    })) || [],
    comments: task.kanban_comments?.map((comment: any) => ({
      id: comment.id,
      taskId: task.id,
      authorId: comment.author_id,
      content: comment.content,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      author: comment.author
    })) || []
  }));
};

export const createKanbanTask = async (
  boardId: string,
  columnId: string,
  title: string,
  description?: string,
  priority: 'low' | 'medium' | 'high' = 'medium',
  dueDate?: Date,
  petitionId?: string
): Promise<KanbanTask | null> => {
  // Get the next position in the column
  const { data: lastTask } = await supabase
    .from('kanban_tasks')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (lastTask?.position || 0) + 1;

  const { data, error } = await supabase
    .from('kanban_tasks')
    .insert({
      board_id: boardId,
      column_id: columnId,
      title,
      description,
      priority,
      due_date: dueDate?.toISOString(),
      position: nextPosition,
      petition_id: petitionId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating kanban task:', error);
    return null;
  }

  return {
    id: data.id,
    boardId: data.board_id,
    columnId: data.column_id,
    title: data.title,
    description: data.description,
    priority: data.priority,
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
    position: data.position,
    isArchived: data.is_archived,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
};

export const updateKanbanTask = async (
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
    columnId?: string;
    position?: number;
    isArchived?: boolean;
  }
): Promise<boolean> => {
  const updateData: any = { ...updates };
  
  // Converter camelCase para snake_case
  if (updates.dueDate) {
    updateData.due_date = updates.dueDate.toISOString();
    delete updateData.dueDate;
  }
  
  if (updates.columnId) {
    updateData.column_id = updates.columnId;
    delete updateData.columnId;
  }
  
  if (updates.isArchived !== undefined) {
    updateData.is_archived = updates.isArchived;
    delete updateData.isArchived;
  }

  const { error } = await supabase
    .from('kanban_tasks')
    .update(updateData)
    .eq('id', taskId);

  if (error) {
    console.error('Error updating kanban task:', error);
    return false;
  }

  return true;
};

export const moveKanbanTask = async (
  taskId: string,
  columnId: string,
  position: number
): Promise<boolean> => {
  return updateKanbanTask(taskId, { columnId, position });
};

export const archiveKanbanTask = async (taskId: string): Promise<boolean> => {
  return updateKanbanTask(taskId, { isArchived: true });
};

export const restoreKanbanTask = async (taskId: string): Promise<boolean> => {
  return updateKanbanTask(taskId, { isArchived: false });
};

// ===== ASSIGNEE FUNCTIONS =====

export const assignUserToTask = async (taskId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('kanban_task_assignees')
    .insert({
      task_id: taskId,
      user_id: userId
    });

  if (error) {
    console.error('Error assigning user to task:', error);
    return false;
  }

  return true;
};

export const unassignUserFromTask = async (taskId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('kanban_task_assignees')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error unassigning user from task:', error);
    return false;
  }

  return true;
};

export const getAvailableUsers = async (): Promise<{ id: string; email: string; name?: string }[]> => {
  try {
    // Lista hardcoded de usuários conhecidos para contornar problemas de RLS
    const knownUsers = [
      {
        id: '4bde4d2e-9894-4063-8caf-eae2e34c5f4c',
        email: 'matheus.mira@cvj.sc.gov.br',
        name: 'Matheus Mira'
      },
      {
        id: '4a9f97bb-7427-40fd-a721-5b51e5248872',
        email: 'adilson.martins.jlle@gmail.com',
        name: 'Adilson Martins'
      }
    ];

    return knownUsers;
  } catch (error) {
    console.error('Error getting available users:', error);
    return [];
  }
};

// ===== LABEL FUNCTIONS =====

export const getKanbanLabels = async (boardId: string): Promise<KanbanLabel[]> => {
  const { data, error } = await supabase
    .from('kanban_labels')
    .select('*')
    .eq('board_id', boardId)
    .order('name');

  if (error) {
    console.error('Error getting kanban labels:', error);
    return [];
  }

  return data.map(label => ({
    id: label.id,
    boardId: label.board_id,
    name: label.name,
    color: label.color,
    createdAt: new Date(label.created_at)
  }));
};

export const createKanbanLabel = async (boardId: string, name: string, color: string): Promise<KanbanLabel | null> => {
  const { data, error } = await supabase
    .from('kanban_labels')
    .insert({
      board_id: boardId,
      name,
      color
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating kanban label:', error);
    return null;
  }

  return {
    id: data.id,
    boardId: data.board_id,
    name: data.name,
    color: data.color,
    createdAt: new Date(data.created_at)
  };
};

export const addLabelToTask = async (taskId: string, labelId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('kanban_task_labels')
    .insert({
      task_id: taskId,
      label_id: labelId
    });

  if (error) {
    console.error('Error adding label to task:', error);
    return false;
  }

  return true;
};

export const removeLabelFromTask = async (taskId: string, labelId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('kanban_task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId);

  if (error) {
    console.error('Error removing label from task:', error);
    return false;
  }

  return true;
};

// ===== COMMENT FUNCTIONS =====

export const addCommentToTask = async (taskId: string, content: string): Promise<KanbanComment | null> => {
  // Buscar informações do usuário atual primeiro
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('kanban_comments')
    .insert({
      task_id: taskId,
      author_id: user.id,
      content
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error adding comment to task:', error);
    return null;
  }
  
  return {
    id: data.id,
    taskId: data.task_id,
    authorId: data.author_id,
    content: data.content,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    author: {
      id: user.id,
      email: user.email || ''
    }
  };
};

export const getKanbanComments = async (taskId: string): Promise<KanbanComment[]> => {
  const { data, error } = await supabase
    .from('kanban_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting kanban comments:', error);
    return [];
  }

  // Mapear os comentários com informações do autor
  return data.map(comment => ({
    id: comment.id,
    taskId: comment.task_id,
    authorId: comment.author_id,
    content: comment.content,
    createdAt: new Date(comment.created_at),
    updatedAt: new Date(comment.updated_at),
    author: {
      id: comment.author_id,
      email: comment.author_id === '4a9f97bb-7427-40fd-a721-5b51e5248872' ? 'adilson.martins.jlle@gmail.com' : 
             comment.author_id === '4bde4d2e-9894-4063-8caf-eae2e34c5f4c' ? 'matheus.mira@cvj.sc.gov.br' : 
             'usuário@exemplo.com'
    }
  }));
};

// ===== SEARCH AND FILTER FUNCTIONS =====

export const searchKanbanTasks = async (
  boardId: string,
  searchTerm: string,
  filters?: {
    assigneeId?: string;
    labelId?: string;
    columnId?: string;
    priority?: string;
    dueDateFilter?: 'overdue' | 'today' | 'week' | 'month';
  }
): Promise<KanbanTask[]> => {
  let query = supabase
    .from('kanban_tasks')
    .select(`
      *,
      kanban_task_assignees (
        id,
        user_id,
        assigned_at,
      ),
      kanban_task_labels (
        id,
        label_id,
        label:kanban_labels (
          id,
          name,
          color
        )
      )
    `)
    .eq('board_id', boardId)
    .eq('is_archived', false);

  // Text search
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  // Filters
  if (filters?.assigneeId) {
    query = query.eq('kanban_task_assignees.user_id', filters.assigneeId);
  }

  if (filters?.labelId) {
    query = query.eq('kanban_task_labels.label_id', filters.labelId);
  }

  if (filters?.columnId) {
    query = query.eq('column_id', filters.columnId);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  // Date filters
  if (filters?.dueDateFilter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const week = new Date(today);
    week.setDate(week.getDate() + 7);
    const month = new Date(today);
    month.setMonth(month.getMonth() + 1);

    switch (filters.dueDateFilter) {
      case 'overdue':
        query = query.lt('due_date', today.toISOString());
        break;
      case 'today':
        query = query.gte('due_date', today.toISOString()).lt('due_date', tomorrow.toISOString());
        break;
      case 'week':
        query = query.gte('due_date', today.toISOString()).lt('due_date', week.toISOString());
        break;
      case 'month':
        query = query.gte('due_date', today.toISOString()).lt('due_date', month.toISOString());
        break;
    }
  }

  const { data, error } = await query.order('position');

  if (error) {
    console.error('Error searching kanban tasks:', error);
    return [];
  }

  return data.map(task => ({
    id: task.id,
    boardId: task.board_id || boardId,
    columnId: task.column_id,
    title: task.title,
    description: task.description,
    priority: task.priority || 'medium',
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    position: task.position,
    isArchived: task.is_archived,
    createdBy: task.created_by || 'unknown',
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
    assignees: task.kanban_task_assignees?.map((assignee: any) => ({
      id: assignee.id,
      taskId: task.id,
      userId: assignee.user_id,
      assignedAt: new Date(assignee.assigned_at),
      user: assignee.user
    })) || [],
    labels: task.kanban_task_labels?.map((taskLabel: any) => ({
      id: taskLabel.id,
      taskId: task.id,
      labelId: taskLabel.label_id,
      label: taskLabel.label
    })) || []
  }));
};

// ===== CHECKLIST FUNCTIONS =====

export const createKanbanChecklist = async (
  taskId: string, 
  title: string
): Promise<KanbanChecklist | null> => {
  try {
    const { data, error } = await supabase
      .from('kanban_checklists')
      .insert({
        task_id: taskId,
        title: title,
        position: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating kanban checklist:', error);
      return null;
    }

    return {
      id: data.id,
      taskId: data.task_id,
      title: data.title,
      position: data.position,
      createdAt: new Date(data.created_at),
      items: []
    };
  } catch (error) {
    console.error('Error creating kanban checklist:', error);
    return null;
  }
};

export const getKanbanChecklists = async (taskId: string): Promise<KanbanChecklist[]> => {
  try {
    const { data, error } = await supabase
      .from('kanban_checklists')
      .select(`
        *,
        kanban_checklist_items (
          id,
          text,
          is_completed,
          position,
          created_at
        )
      `)
      .eq('task_id', taskId)
      .order('position');

    if (error) {
      console.error('Error getting kanban checklists:', error);
      return [];
    }

    return data.map(checklist => ({
      id: checklist.id,
      taskId: checklist.task_id,
      title: checklist.title,
      position: checklist.position,
      createdAt: new Date(checklist.created_at),
      items: checklist.kanban_checklist_items?.map((item: any) => ({
        id: item.id,
        checklistId: checklist.id,
        text: item.text,
        isCompleted: item.is_completed,
        position: item.position,
        createdAt: new Date(item.created_at)
      })) || []
    }));
  } catch (error) {
    console.error('Error getting kanban checklists:', error);
    return [];
  }
};

export const createKanbanChecklistItem = async (
  checklistId: string, 
  text: string
): Promise<KanbanChecklistItem | null> => {
  try {
    const { data, error } = await supabase
      .from('kanban_checklist_items')
      .insert({
        checklist_id: checklistId,
        text: text,
        is_completed: false,
        position: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating kanban checklist item:', error);
      return null;
    }

    return {
      id: data.id,
      checklistId: data.checklist_id,
      text: data.text,
      isCompleted: data.is_completed,
      position: data.position,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error creating kanban checklist item:', error);
    return null;
  }
};

export const toggleKanbanChecklistItem = async (
  itemId: string, 
  isCompleted: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('kanban_checklist_items')
      .update({ is_completed: isCompleted })
      .eq('id', itemId);

    if (error) {
      console.error('Error toggling kanban checklist item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error toggling kanban checklist item:', error);
    return false;
  }
};

export const deleteKanbanChecklistItem = async (itemId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('kanban_checklist_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting kanban checklist item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting kanban checklist item:', error);
    return false;
  }
};

export const deleteKanbanChecklist = async (checklistId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('kanban_checklists')
      .delete()
      .eq('id', checklistId);

    if (error) {
      console.error('Error deleting kanban checklist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting kanban checklist:', error);
    return false;
  }
};

// ===== ATTACHMENT FUNCTIONS =====

export const addKanbanAttachment = async (
  taskId: string, 
  type: 'link' | 'file', 
  url: string, 
  fileName?: string
): Promise<KanbanAttachment | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('kanban_attachments')
      .insert({
        task_id: taskId,
        type: type,
        url: url,
        file_name: fileName || (type === 'link' ? 'Link' : 'Arquivo'),
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding kanban attachment:', error);
      return null;
    }

    return {
      id: data.id,
      taskId: data.task_id,
      type: data.type,
      url: data.url,
      fileName: data.file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error adding kanban attachment:', error);
    return null;
  }
};

export const getKanbanAttachments = async (taskId: string): Promise<KanbanAttachment[]> => {
  try {
    const { data, error } = await supabase
      .from('kanban_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting kanban attachments:', error);
      return [];
    }

    return data.map(attachment => ({
      id: attachment.id,
      taskId: attachment.task_id,
      type: attachment.type,
      url: attachment.url,
      fileName: attachment.file_name,
      fileSize: attachment.file_size,
      mimeType: attachment.mime_type,
      createdBy: attachment.created_by,
      createdAt: new Date(attachment.created_at)
    }));
  } catch (error) {
    console.error('Error getting kanban attachments:', error);
    return [];
  }
};

export const deleteKanbanAttachment = async (attachmentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('kanban_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      console.error('Error deleting kanban attachment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting kanban attachment:', error);
    return false;
  }
};
