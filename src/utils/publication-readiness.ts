import { validateName } from './validation';

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'campanhas',
  'contato',
  'dashboard',
  'faq',
  'login',
  'petitions',
  'settings',
  'sobre',
  'tasks',
  'termos',
]);

export interface PublicationChecklistItem {
  id: 'name' | 'slug' | 'description' | 'goal' | 'image';
  label: string;
  description: string;
  complete: boolean;
}

export interface PublicationReadinessInput {
  name: string;
  slug: string;
  description?: string;
  signatureGoal?: number | null;
  imageUrl?: string;
  isSlugUnique?: boolean;
}

export const validatePetitionSlug = (slug: string): string | null => {
  const normalized = slug.trim().toLowerCase();

  if (!normalized) {
    return 'Defina a URL pública da campanha.';
  }

  if (normalized.length < 3) {
    return 'A URL pública precisa ter pelo menos 3 caracteres.';
  }

  if (RESERVED_SLUGS.has(normalized)) {
    return 'Essa URL é reservada pelo sistema.';
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return 'Use apenas letras minúsculas, números e hífens.';
  }

  return null;
};

export const getPublicationChecklist = ({
  name,
  slug,
  description,
  signatureGoal,
  imageUrl,
  isSlugUnique = true,
}: PublicationReadinessInput): PublicationChecklistItem[] => {
  const cleanDescription = description?.trim() || '';
  const slugError = validatePetitionSlug(slug);
  const hasSignatureGoal = Number.isInteger(signatureGoal) && Number(signatureGoal) > 0;

  return [
    {
      id: 'name',
      label: 'Título da campanha',
      description: 'Use um nome claro para a mobilização.',
      complete: !validateName(name),
    },
    {
      id: 'slug',
      label: 'URL pública revisada',
      description: isSlugUnique ? 'Pronta para divulgação.' : 'Escolha uma URL que ainda não exista.',
      complete: !slugError && isSlugUnique,
    },
    {
      id: 'description',
      label: 'Conteúdo mínimo',
      description: 'Adicione pelo menos 24 caracteres de contexto.',
      complete: cleanDescription.length >= 24,
    },
    {
      id: 'goal',
      label: 'Meta de assinaturas',
      description: 'Defina a meta obrigatória para publicar online.',
      complete: hasSignatureGoal,
    },
    {
      id: 'image',
      label: 'Capa pública',
      description: 'A home e a página pública usam essa imagem.',
      complete: Boolean(imageUrl),
    },
  ];
};

export const isPublicationReady = (input: PublicationReadinessInput) =>
  getPublicationChecklist(input).every((item) => item.complete);
