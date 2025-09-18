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

  // Criar tabela específica para as assinaturas
  console.log('Creating signatures table:', tableName);
  
  // SOLUÇÃO ALTERNATIVA: Usar uma tabela única para todas as assinaturas
  // Em vez de criar tabelas dinâmicas, vamos usar uma tabela única com petition_id
  console.log('Using unified signatures table approach...');
  
  // Verificar se a tabela signatures existe, se não, criar
  const { error: checkTableError } = await supabase
    .from('signatures')
    .select('id')
    .limit(1);
  
  if (checkTableError && checkTableError.code === 'PGRST116') {
    // Tabela não existe, vamos criar via migração manual
    console.log('Signatures table does not exist. Please run the migration manually.');
    console.log('Execute this SQL in Supabase SQL Editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  mensagem_enviada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant permissions
GRANT ALL ON TABLE signatures TO authenticated;
GRANT ALL ON TABLE signatures TO service_role;

-- Enable RLS
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON signatures 
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON signatures 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON signatures 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users" ON signatures 
FOR DELETE USING (auth.role() = 'authenticated');
    `);
    
    // Tentar remover a petition se a tabela não foi criada
    await supabase.from('petitions').delete().eq('id', data.id);
    return null;
  }

  console.log('Signatures table exists, proceeding...');

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description || undefined,
    location: data.location || undefined,
    collectionDate: data.collection_date ? new Date(data.collection_date) : undefined,
    responsible: data.responsible || undefined,
    imageUrl: data.image_url || undefined,
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

export const updateSignatureMessageStatus = async (signatureId: string, mensagemEnviada: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('signatures')
    .update({ mensagem_enviada: mensagemEnviada })
    .eq('id', signatureId);

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