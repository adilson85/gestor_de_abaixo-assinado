import { supabase } from '../lib/supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Tenta criar o bucket se não existir
const ensureBucketExists = async (bucket: string): Promise<boolean> => {
  try {
    // Verificar se o bucket existe listando seus arquivos
    const { error: listError } = await supabase.storage.from(bucket).list('', { limit: 1 });
    
    if (listError) {
      // Se o bucket não existe, tentar criar
      console.log(`Bucket '${bucket}' não encontrado, tentando criar...`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError && !createError.message.includes('already exists')) {
        console.error('Erro ao criar bucket:', createError);
        return false;
      }
      console.log(`Bucket '${bucket}' criado com sucesso!`);
    }
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error);
    return false;
  }
};

export const uploadImage = async (
  file: File,
  bucket: string = 'petition-images',
  folder: string = 'petitions'
): Promise<UploadResult> => {
  try {
    console.log(`Iniciando upload de imagem: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Garantir que o bucket existe
    const bucketReady = await ensureBucketExists(bucket);
    if (!bucketReady) {
      return {
        success: false,
        error: 'Não foi possível acessar o armazenamento de imagens. Verifique as configurações do Supabase Storage.',
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log(`Fazendo upload para: ${bucket}/${filePath}`);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload:', error);
      
      // Mensagens de erro mais específicas
      if (error.message.includes('Bucket not found')) {
        return {
          success: false,
          error: 'Bucket de armazenamento não encontrado. Configure o Supabase Storage.',
        };
      }
      if (error.message.includes('Permission denied') || error.message.includes('policy')) {
        return {
          success: false,
          error: 'Sem permissão para fazer upload. Verifique as políticas do Supabase Storage.',
        };
      }
      if (error.message.includes('Payload too large')) {
        return {
          success: false,
          error: 'Imagem muito grande. O tamanho máximo é 5MB.',
        };
      }
      
      return {
        success: false,
        error: `Erro ao fazer upload: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('Upload concluído! URL:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Erro inesperado no upload:', error);
    return {
      success: false,
      error: 'Erro inesperado ao fazer upload. Verifique o console para mais detalhes.',
    };
  }
};

export const deleteImage = async (
  url: string,
  bucket: string = 'petition-images'
): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

export const createImageBucket = async (bucketName: string = 'petition-images'): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bucket:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating bucket:', error);
    return false;
  }
};
