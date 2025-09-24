import { supabase } from '../lib/supabase';
import { Petition, Signature } from '../types';
import { generateSlug } from './validation';

// Petitions
export const getPetitions = async (): Promise<Petition[]> => {
  const { data, error } = await supabase
    .from('petitions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching petitions:', error);
    return [];
  }

  return data.map(petition => ({
    id: petition.id,
    slug: petition.slug,
    name: petition.name,
    description: petition.description || undefined,
    location: petition.location || undefined,
    collectionDate: petition.collection_date ? new Date(petition.collection_date) : undefined,
    responsible: petition.responsible || undefined,
    imageUrl: petition.image_url || undefined,
    availableOnline: petition.available_online || false,
    tableName: petition.table_name,
    createdAt: new Date(petition.created_at),
    updatedAt: new Date(petition.updated_at),
  }));
};

export const getPetitionById = async (id: string): Promise<Petition | null> => {
  const { data, error } = await supabase
    .from('petitions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching petition:', error);
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description || undefined,
    location: data.location || undefined,
    collectionDate: data.collection_date ? new Date(data.collection_date) : undefined,
    responsible: data.responsible || undefined,
    imageUrl: data.image_url || undefined,
    availableOnline: data.available_online || false,
    tableName: data.table_name,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

export const getPetitionBySlug = async (slug: string): Promise<Petition | null> => {
  const { data, error } = await supabase
    .from('petitions')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error('Error fetching petition by slug:', error);
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description || undefined,
    location: data.location || undefined,
    collectionDate: data.collection_date ? new Date(data.collection_date) : undefined,
    responsible: data.responsible || undefined,
    imageUrl: data.image_url || undefined,
    availableOnline: data.available_online || false,
    tableName: data.table_name,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

export const savePetition = async (petition: Omit<Petition, 'id' | 'createdAt' | 'updatedAt' | 'tableName'>): Promise<Petition | null> => {
  // Gerar nome único para a tabela
  const tableName = `signatures_${generateSlug(petition.name)}_${Date.now()}`;
  
  const petitionData = {
    slug: petition.slug,
    name: petition.name,
    description: petition.description || null,
    location: petition.location || null,
    collection_date: petition.collectionDate ? petition.collectionDate.toISOString().split('T')[0] : null,
    responsible: petition.responsible || null,
    image_url: petition.imageUrl || null,
    available_online: petition.availableOnline || false,
    table_name: tableName,
  };

  console.log('Inserting petition data:', petitionData);
  const { data, error } = await supabase
    .from('petitions')
    .insert(petitionData)
    .select()
    .single();

  if (error) {
    console.error('Error creating petition:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return null;
  }

  console.log('Petition created successfully:', data);

  // Criar tarefa Kanban automaticamente (opcional) - TEMPORARIAMENTE DESABILITADO
  // try {
  //   await createKanbanTaskForPetition(data.id, petition.name, petition.description || '');
  //   console.log('Kanban task created successfully for petition:', data.id);
  // } catch (kanbanError) {
  //   console.error('Error creating Kanban task:', kanbanError);
  //   // Não falhar a criação do petition se o Kanban falhar
  //   console.log('Continuing without Kanban task...');
  // }

  // A tabela signatures já existe, não precisa verificar
  console.log('Petition created successfully with signatures table ready.');

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description || undefined,
    location: data.location || undefined,
    collectionDate: data.collection_date ? new Date(data.collection_date) : undefined,
    responsible: data.responsible || undefined,
    imageUrl: data.image_url || undefined,
    availableOnline: data.available_online || false,
    tableName: data.table_name,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

export const updatePetition = async (id: string, updates: Partial<Petition>): Promise<Petition | null> => {
  const updateData = {
    name: updates.name,
    description: updates.description || null,
    location: updates.location || null,
    collection_date: updates.collectionDate ? updates.collectionDate.toISOString().split('T')[0] : null,
    responsible: updates.responsible || null,
    image_url: updates.imageUrl || null,
    available_online: updates.availableOnline,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('petitions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating petition:', error);
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description || undefined,
    location: data.location || undefined,
    collectionDate: data.collection_date ? new Date(data.collection_date) : undefined,
    responsible: data.responsible || undefined,
    imageUrl: data.image_url || undefined,
    availableOnline: data.available_online || false,
    tableName: data.table_name,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

export const deletePetition = async (id: string): Promise<boolean> => {
  // Primeiro, buscar o nome da tabela
  const petition = await getPetitionById(id);
  if (!petition) return false;

  // Deletar a tabela de assinaturas
  const { error: dropError } = await supabase.rpc('exec', {
    sql: `DROP TABLE IF EXISTS ${petition.tableName}`
  });

  if (dropError) {
    console.error('Error dropping signatures table:', dropError);
  }

  // Deletar a petition
  const { error } = await supabase
    .from('petitions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting petition:', error);
    return false;
  }

  return true;
};

// Signatures
export const getSignaturesByPetition = async (petitionId: string): Promise<Signature[]> => {
  const { data, error } = await supabase
    .from('signatures')
    .select('*')
    .eq('petition_id', petitionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching signatures:', error);
    return [];
  }

  return data.map(signature => ({
    id: signature.id,
    name: signature.name,
    phone: signature.phone,
    street: signature.street || undefined,
    neighborhood: signature.neighborhood || undefined,
    city: signature.city || undefined,
    state: signature.state || undefined,
    zipCode: signature.zip_code || undefined,
    mensagemEnviada: signature.mensagem_enviada || false,
    createdAt: new Date(signature.created_at),
  }));
};

export const saveSignature = async (petitionId: string, signature: Omit<Signature, 'id' | 'createdAt'>): Promise<Signature | null> => {
  const signatureData = {
    petition_id: petitionId,
    name: signature.name,
    phone: signature.phone,
    street: signature.street || null,
    neighborhood: signature.neighborhood || null,
    city: signature.city || null,
    state: signature.state || null,
    zip_code: signature.zipCode || null,
    mensagem_enviada: signature.mensagemEnviada || false,
  };

  const { data, error } = await supabase
    .from('signatures')
    .insert(signatureData)
    .select()
    .single();

  if (error) {
    console.error('Error saving signature:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    street: data.street || undefined,
    neighborhood: data.neighborhood || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    zipCode: data.zip_code || undefined,
    mensagemEnviada: data.mensagem_enviada || false,
    createdAt: new Date(data.created_at),
  };
};

export const checkPhoneDuplicate = async (petitionId: string, phone: string, excludeId?: string): Promise<boolean> => {
  let query = supabase
    .from('signatures')
    .select('id')
    .eq('petition_id', petitionId)
    .eq('phone', phone);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking phone duplicate:', error);
    return false;
  }

  return data && data.length > 0;
};

export const getSignatureCount = async (petitionId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('signatures')
    .select('*', { count: 'exact', head: true })
    .eq('petition_id', petitionId);

  if (error) {
    console.error('Error getting signature count:', error);
    return 0;
  }

  return count || 0;
};

export const getTotalSignatureCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('signatures')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting total signature count:', error);
    return 0;
  }

  return count || 0;
};

export const getSentMessagesCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('signatures')
    .select('*', { count: 'exact', head: true })
    .eq('mensagem_enviada', true);

  if (error) {
    console.error('Error getting sent messages count:', error);
    return 0;
  }

  return count || 0;
};

export const getNotSentMessagesCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('signatures')
    .select('*', { count: 'exact', head: true })
    .eq('mensagem_enviada', false);

  if (error) {
    console.error('Error getting not sent messages count:', error);
    return 0;
  }

  return count || 0;
};

export const updateSignatureMessageStatus = async (petitionId: string, signatureId: string, mensagemEnviada: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('signatures')
    .update({ mensagem_enviada: mensagemEnviada })
    .eq('id', signatureId)
    .eq('petition_id', petitionId);

  if (error) {
    console.error('Error updating signature message status:', error);
    return false;
  }

  return true;
};

export const updateSignature = async (
  signatureId: string,
  updates: Partial<Pick<Signature, 'name' | 'phone' | 'street' | 'neighborhood' | 'city' | 'state' | 'zipCode' | 'mensagemEnviada'>>
): Promise<Signature | null> => {
  const payload: any = {};
  if (typeof updates.name === 'string') payload.name = updates.name;
  if (typeof updates.phone === 'string') payload.phone = updates.phone;
  if (typeof updates.street !== 'undefined') payload.street = updates.street ?? null;
  if (typeof updates.neighborhood !== 'undefined') payload.neighborhood = updates.neighborhood ?? null;
  if (typeof updates.city !== 'undefined') payload.city = updates.city ?? null;
  if (typeof updates.state !== 'undefined') payload.state = updates.state ?? null;
  if (typeof updates.zipCode !== 'undefined') payload.zip_code = updates.zipCode ?? null;
  if (typeof updates.mensagemEnviada !== 'undefined') payload.mensagem_enviada = updates.mensagemEnviada;

  const { data, error } = await supabase
    .from('signatures')
    .update(payload)
    .eq('id', signatureId)
    .select()
    .single();

  if (error) {
    console.error('Error updating signature:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    street: data.street || undefined,
    neighborhood: data.neighborhood || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    zipCode: data.zip_code || undefined,
    mensagemEnviada: data.mensagem_enviada || false,
    createdAt: new Date(data.created_at),
  };
};

export const deleteSignature = async (signatureId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('signatures')
    .delete()
    .eq('id', signatureId);

  if (error) {
    console.error('Error deleting signature:', error);
    return false;
  }

  return true;
};

// Resources (YouTube / Drive / Link)
export interface PetitionResource {
  id: string;
  petitionId: string;
  type: 'youtube' | 'drive' | 'link';
  title?: string;
  url: string;
  createdAt: Date;
}

export const getPetitionResources = async (petitionId: string): Promise<PetitionResource[]> => {
  const { data, error } = await supabase
    .from('petition_resources')
    .select('*')
    .eq('petition_id', petitionId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(r => ({
    id: r.id,
    petitionId: r.petition_id,
    type: r.type,
    title: r.title || undefined,
    url: r.url,
    createdAt: new Date(r.created_at),
  }));
};

export const addPetitionResource = async (petitionId: string, resource: Omit<PetitionResource, 'id' | 'createdAt' | 'petitionId'>): Promise<PetitionResource | null> => {
  const payload = {
    petition_id: petitionId,
    type: resource.type,
    title: resource.title || null,
    url: resource.url,
  };

  const { data, error } = await supabase
    .from('petition_resources')
    .insert(payload)
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    petitionId: data.petition_id,
    type: data.type,
    title: data.title || undefined,
    url: data.url,
    createdAt: new Date(data.created_at),
  };
};

export const deletePetitionResource = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('petition_resources')
    .delete()
    .eq('id', id);
  return !error;
};

// Função para criar tarefa Kanban automaticamente quando um petition é criado
const createKanbanTaskForPetition = async (petitionId: string, petitionName: string, petitionDescription: string): Promise<void> => {
  try {
    // 1. Buscar board Kanban global
    const { data: boards, error: boardsError } = await supabase
      .from('kanban_boards')
      .select('id')
      .eq('is_global', true)
      .limit(1);

    if (boardsError || !boards || boards.length === 0) {
      console.error('Board Kanban não encontrado:', boardsError);
      return;
    }

    const boardId = boards[0].id;

    // 2. Buscar coluna "Coleta de assinaturas"
    const { data: columns, error: columnsError } = await supabase
      .from('kanban_columns')
      .select('id')
      .eq('board_id', boardId)
      .eq('name', 'Coleta de assinaturas')
      .limit(1);

    if (columnsError || !columns || columns.length === 0) {
      console.error('Coluna "Coleta de assinaturas" não encontrada:', columnsError);
      return;
    }

    const columnId = columns[0].id;

    // 3. Buscar usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Usuário não autenticado');
      return;
    }

    // 4. Criar tarefa Kanban
    const { error: taskError } = await supabase
      .from('kanban_tasks')
      .insert({
        board_id: boardId,
        column_id: columnId,
        petition_id: petitionId,
        title: petitionName,
        description: petitionDescription,
        priority: 'medium',
        position: 0,
        created_by: user.id
      });

    if (taskError) {
      console.error('Erro ao criar tarefa Kanban:', taskError);
      throw taskError;
    }

    console.log('Tarefa Kanban criada com sucesso para petition:', petitionId);
  } catch (error) {
    console.error('Erro na criação da tarefa Kanban:', error);
    throw error;
  }
};