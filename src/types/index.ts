export interface Petition {
  id: string;
  slug: string;
  name: string;
  description?: string;
  location?: string; // Local onde foi coletado
  collectionDate?: Date; // Data da coleta física
  responsible?: string; // Responsável pela coleta
  imageUrl?: string; // URL da imagem do abaixo-assinado físico
  availableOnline?: boolean; // Se está disponível para assinatura online
  tableName: string; // Nome da tabela específica no Supabase
  createdAt: Date;
  updatedAt: Date;
  signatures?: Signature[]; // Opcional, carregado separadamente
}

export interface Signature {
  id: string;
  name: string;
  phone: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string; // UF - 2 letters
  zipCode?: string; // CEP - 8 digits
  mensagemEnviada?: boolean; // Se a mensagem foi enviada via WhatsApp
  createdAt: Date;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PetitionResource {
  id: string;
  petitionId: string;
  type: 'youtube' | 'drive' | 'link';
  title?: string;
  url: string;
  createdAt: Date;
}

// Kanban Types
export interface KanbanBoard {
  id: string;
  petitionId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumnDeadline {
  id: string;
  columnId: string;
  durationValue: number;
  durationUnit: 'days' | 'months' | 'years';
  createdAt: Date;
  updatedAt: Date;
  column?: KanbanColumn;
}

export interface KanbanTask {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  position: number;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  petitionId?: string;
  assignees?: KanbanTaskAssignee[];
  labels?: KanbanTaskLabel[];
  checklists?: KanbanChecklist[];
  attachments?: KanbanAttachment[];
  comments?: KanbanComment[];
}

export interface KanbanTaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: Date;
  user?: {
    id: string;
    email: string;
  };
}

export interface KanbanLabel {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface KanbanTaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  label?: KanbanLabel;
}

export interface KanbanChecklist {
  id: string;
  taskId: string;
  title: string;
  position: number;
  createdAt: Date;
  items?: KanbanChecklistItem[];
}

export interface KanbanChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  isCompleted: boolean;
  position: number;
  createdAt: Date;
}

export interface KanbanAttachment {
  id: string;
  taskId: string;
  type: 'link' | 'file';
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdBy: string;
  createdAt: Date;
}

export interface KanbanComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    email: string;
  };
}

export interface KanbanActivity {
  id: string;
  taskId: string;
  actorId: string;
  actionType: string;
  payload?: any;
  createdAt: Date;
  actor?: {
    id: string;
    email: string;
  };
}