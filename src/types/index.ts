export interface Petition {
  id: string;
  slug: string;
  name: string;
  description?: string;
  location?: string; // Local onde foi coletado
  collectionDate?: Date; // Data da coleta física
  responsible?: string; // Responsável pela coleta
  imageUrl?: string; // URL da imagem do abaixo-assinado físico
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