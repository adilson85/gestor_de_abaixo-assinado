import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  Download, 
  Plus,
  Search,
  Calendar,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Edit3,
  Eye,
  EyeOff,
  BarChart3,
  MessageCircle,
  CheckCircle,
  XCircle,
  FileText,
  Trash2,
  Copy
} from 'lucide-react';
import { 
  getPetitionById, 
  getSignaturesByPetition, 
  updatePetition, 
  saveSignature, 
  checkPhoneDuplicate,
  updateSignatureMessageStatus,
  updateMultipleSignatureMessageStatus,
  updateSignature,
  deleteSignature,
  hasKanbanTasks,
  createKanbanTaskForPetition
} from '../utils/supabase-storage';
import { generateBotConversaUrl, isValidWhatsAppNumber } from '../utils/whatsapp-utils';
import {
  downloadHtmlDocument,
  exportToCSV,
  generatePublicSectorPresentationDocument
} from '../utils/export';
import { Petition, Signature, PetitionResource } from '../types';
import { validateName, validatePhone, validateState, validateZipCode, normalizePhone, formatPhone } from '../utils/validation';
import { fetchAddressByCEP, formatCEP } from '../utils/cep';
import { Pagination } from '../components/Pagination';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { ImageUpload } from '../components/ImageUpload';
import { useDebounce } from '../hooks/useDebounce';
import { getPetitionResources, addPetitionResource, deletePetitionResource } from '../utils/supabase-storage';
import { uploadImage, deleteImage } from '../utils/image-storage';
import { getPublicPetitionUrl } from '../utils/public-url';
import { getPublicationChecklist, isPublicationReady } from '../utils/publication-readiness';
import { useAuth } from '../contexts/AuthContext';
import { clearFormDraft, getFormDraft, setFormDraft } from '../utils/form-drafts';

const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

interface NewSignatureDraft {
  showAddSignature: boolean;
  newSignature: {
    name: string;
    phone: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  addressInput: string;
}

interface ResourceDraft {
  title: string;
  url: string;
  type: 'youtube' | 'drive' | 'link';
}

interface PetitionSettingsDraft {
  isEditing: boolean;
  editName: string;
  editDescription: string;
  editLocation: string;
  editCollectionDate: string;
  editResponsible: string;
  editSignatureGoal: string;
  editImageUrl?: string;
  editImageFile: File | null;
  imagePreview?: string;
}

const EMPTY_NEW_SIGNATURE: NewSignatureDraft['newSignature'] = {
  name: '',
  phone: '',
  street: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
};

const getPetitionDraftKey = (petitionId: string, scope: 'signature' | 'resources' | 'settings') =>
  `admin:petition:${petitionId}:${scope}:draft`;

export const PetitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();
  const restoredSignatureDraft = id ? getFormDraft<NewSignatureDraft>(getPetitionDraftKey(id, 'signature')) : null;
  const restoredResourceDraft = id ? getFormDraft<ResourceDraft>(getPetitionDraftKey(id, 'resources')) : null;
  const [petition, setPetition] = useState<Petition | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [activeTab, setActiveTab] = useState<'signatures' | 'settings' | 'export' | 'links'>('signatures');
  const [showAddSignature, setShowAddSignature] = useState(restoredSignatureDraft?.showAddSignature || false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;
  const publicPetitionUrl = petition ? getPublicPetitionUrl(petition.slug) : '';
  const canViewSignatures = can('signatures.view', 'any');
  const canCreateManualSignature = can('signatures.create_manual', 'any');
  const canEditSignatures = can('signatures.edit', 'any');
  const canDeleteSignatures = can('signatures.delete', 'any');
  const canUpdateMessageStatus = can('signatures.message_status', 'any');
  const canViewPetitionSettings = can('petitions.edit', 'any') || can('petitions.publish', 'any');
  const canEditPetition = can('petitions.edit', 'any');
  const canPublishPetition = can('petitions.publish', 'any');
  const canManageResources = can('petition_resources.manage', 'any');
  const canExportSignatures = can('signatures.export', 'any');
  const canCreateKanbanTask = can('kanban.create', 'any');

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // New signature form state
  const [newSignature, setNewSignature] = useState(restoredSignatureDraft?.newSignature || EMPTY_NEW_SIGNATURE);
  const [signatureErrors, setSignatureErrors] = useState<{ [key: string]: string }>({});
  const [editingSignatureId, setEditingSignatureId] = useState<string | null>(null);
  const [editingSignatureName, setEditingSignatureName] = useState<string>('');
  const [showEditSignature, setShowEditSignature] = useState(false);
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const [editSignatureErrors, setEditSignatureErrors] = useState<{ [key: string]: string }>({});
  const [deletingSignatureId, setDeletingSignatureId] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState(restoredSignatureDraft?.addressInput || '');

  // Links
  const [resources, setResources] = useState<PetitionResource[]>([]);
  const [newResourceTitle, setNewResourceTitle] = useState(restoredResourceDraft?.title || '');
  const [newResourceUrl, setNewResourceUrl] = useState(restoredResourceDraft?.url || '');
  const [newResourceType, setNewResourceType] = useState<'youtube' | 'drive' | 'link'>(
    restoredResourceDraft?.type || 'link'
  );
  const [resourceError, setResourceError] = useState<string>('');
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [hasTask, setHasTask] = useState<boolean | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [bulkMessageStatusAction, setBulkMessageStatusAction] = useState<'sent' | 'unsent' | null>(null);

  // Settings form state
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCollectionDate, setEditCollectionDate] = useState('');
  const [editResponsible, setEditResponsible] = useState('');
  const [editSignatureGoal, setEditSignatureGoal] = useState('');
  const [editSignatureGoalError, setEditSignatureGoalError] = useState('');
  const [editImageUrl, setEditImageUrl] = useState<string | undefined>('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [availabilityFeedback, setAvailabilityFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showAvailabilityFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setAvailabilityFeedback({ type, message });
    window.setTimeout(() => {
      setAvailabilityFeedback((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  const resetPetitionSettingsForm = () => {
    if (!petition) {
      setIsEditing(false);
      return;
    }

    setEditName(petition.name);
    setEditDescription(petition.description || '');
    setEditLocation(petition.location || '');
    setEditCollectionDate(petition.collectionDate ? petition.collectionDate.toISOString().split('T')[0] : '');
    setEditResponsible(petition.responsible || '');
    setEditSignatureGoal(petition.signatureGoal ? String(petition.signatureGoal) : '');
    setEditSignatureGoalError('');
    setEditImageUrl(petition.imageUrl);
    setEditImageFile(null);
    setImagePreview(petition.imageUrl);
    setUploadError('');
    setIsEditing(false);
    clearFormDraft(getPetitionDraftKey(petition.id, 'settings'));
  };

  const handleCopyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showAvailabilityFeedback('success', successMessage);
    } catch (error) {
      console.error('Error copying text to clipboard:', error);
      showAvailabilityFeedback('error', 'Não foi possível copiar agora. Tente novamente.');
    }
  };

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      try {
        const currentPetition = await getPetitionById(id);
        
        if (!currentPetition) {
          navigate('/petitions');
          return;
        }
        
        setPetition(currentPetition);
        const settingsDraft = getFormDraft<PetitionSettingsDraft>(getPetitionDraftKey(currentPetition.id, 'settings'));
        setEditName(settingsDraft?.editName ?? currentPetition.name);
        setEditDescription(settingsDraft?.editDescription ?? currentPetition.description ?? '');
        setEditLocation(settingsDraft?.editLocation ?? currentPetition.location ?? '');
        setEditCollectionDate(
          settingsDraft?.editCollectionDate ??
            (currentPetition.collectionDate ? currentPetition.collectionDate.toISOString().split('T')[0] : '')
        );
        setEditResponsible(settingsDraft?.editResponsible ?? currentPetition.responsible ?? '');
        setEditSignatureGoal(
          settingsDraft?.editSignatureGoal ?? (currentPetition.signatureGoal ? String(currentPetition.signatureGoal) : '')
        );
        setEditSignatureGoalError('');
        setEditImageUrl(settingsDraft?.editImageUrl ?? currentPetition.imageUrl);
        setEditImageFile(settingsDraft?.editImageFile ?? null);
        setImagePreview(settingsDraft?.imagePreview ?? currentPetition.imageUrl);
        setIsEditing(settingsDraft?.isEditing ?? false);
        
        const petitionSignatures = await getSignaturesByPetition(currentPetition.id);
        setSignatures(petitionSignatures);

        // Carregar links
        const r = await getPetitionResources(currentPetition.id);
        setResources(r);

        // Verificar se há tarefas Kanban
        const hasKanban = await hasKanbanTasks(currentPetition.id);
        setHasTask(hasKanban);
      } catch (error) {
        console.error('Error loading petition data:', error);
        navigate('/petitions');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    setFormDraft<NewSignatureDraft>(getPetitionDraftKey(id, 'signature'), {
      showAddSignature,
      newSignature,
      addressInput,
    });
  }, [id, showAddSignature, newSignature, addressInput]);

  useEffect(() => {
    if (!id) return;

    setFormDraft<ResourceDraft>(getPetitionDraftKey(id, 'resources'), {
      title: newResourceTitle,
      url: newResourceUrl,
      type: newResourceType,
    });
  }, [id, newResourceTitle, newResourceUrl, newResourceType]);

  useEffect(() => {
    if (!petition) return;

    setFormDraft<PetitionSettingsDraft>(getPetitionDraftKey(petition.id, 'settings'), {
      isEditing,
      editName,
      editDescription,
      editLocation,
      editCollectionDate,
      editResponsible,
      editSignatureGoal,
      editImageUrl,
      editImageFile,
      imagePreview,
    });
  }, [
    petition,
    isEditing,
    editName,
    editDescription,
    editLocation,
    editCollectionDate,
    editResponsible,
    editSignatureGoal,
    editImageUrl,
    editImageFile,
    imagePreview,
  ]);

  const handleAddSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petition) return;

    const errors: { [key: string]: string } = {};
    
    const nameError = validateName(newSignature.name);
    if (nameError) errors.name = nameError;
    
    const phoneError = validatePhone(newSignature.phone);
    if (phoneError) errors.phone = phoneError;
    
    const stateError = validateState(newSignature.state);
    if (stateError) errors.state = stateError;
    
    const zipCodeError = validateZipCode(newSignature.zipCode);
    if (zipCodeError) errors.zipCode = zipCodeError;

    // Check for duplicate phone
    const normalizedPhone = normalizePhone(newSignature.phone);
    const isDuplicate = await checkPhoneDuplicate(petition.id, normalizedPhone);
    if (isDuplicate) {
      errors.phone = 'Este telefone já foi cadastrado neste abaixo-assinado';
    }

    if (Object.keys(errors).length > 0) {
      setSignatureErrors(errors);
      return;
    }

    const signatureData = {
      name: newSignature.name.trim(),
      phone: normalizedPhone,
      street: newSignature.street.trim() || undefined,
      neighborhood: newSignature.neighborhood.trim() || undefined,
      city: newSignature.city.trim() || undefined,
      state: newSignature.state.toUpperCase() || undefined,
      zipCode: newSignature.zipCode.replace(/\D/g, '') || undefined,
    };

    try {
      const savedSignature = await saveSignature(petition.id, signatureData);
      if (savedSignature) {
        setSignatures(prev => [savedSignature, ...prev]);
        
        // Reset form
        setNewSignature({
          name: '',
          phone: '',
          street: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: '',
        });
        setAddressInput('');
        setSignatureErrors({});
        setShowAddSignature(false);
        clearFormDraft(getPetitionDraftKey(petition.id, 'signature'));
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      setSignatureErrors({ general: 'Erro ao salvar assinatura. Tente novamente.' });
    }
  };

  const handleToggleMessageStatus = async (signatureId: string, mensagemEnviada: boolean) => {
    if (!petition) return;

    try {
      const success = await updateSignatureMessageStatus(petition.id, signatureId, mensagemEnviada);
      if (success) {
        setSignatures(prev => prev.map(sig => 
          sig.id === signatureId 
            ? { ...sig, mensagemEnviada }
            : sig
        ));
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      // Fallback: atualizar apenas no estado local se a migração não foi executada
      setSignatures(prev => prev.map(sig => 
        sig.id === signatureId 
          ? { ...sig, mensagemEnviada }
          : sig
      ));
    }
  };

  const handleBulkMessageStatusUpdate = async (mensagemEnviada: boolean) => {
    if (!petition || !canUpdateMessageStatus || filteredSignatures.length === 0) return;

    const actionLabel = mensagemEnviada ? 'marcar como "Sim"' : 'marcar como "Não"';
    const filteredIds = filteredSignatures.map((signature) => signature.id);

    if (
      !confirm(
        `Deseja ${actionLabel} ${filteredIds.length} assinatura(s) com base nos filtros atuais?`
      )
    ) {
      return;
    }

    setBulkMessageStatusAction(mensagemEnviada ? 'sent' : 'unsent');

    try {
      const updatedCount = await updateMultipleSignatureMessageStatus(petition.id, filteredIds, mensagemEnviada);
      const filteredIdSet = new Set(filteredIds);

      setSignatures((previous) =>
        previous.map((signature) =>
          filteredIdSet.has(signature.id) ? { ...signature, mensagemEnviada } : signature
        )
      );

      alert(
        `${updatedCount} assinatura(s) foram marcadas como ${
          mensagemEnviada ? '"Sim"' : '"Não"'
        }.`
      );
    } catch (error) {
      console.error('Error updating multiple message statuses:', error);
      alert('Não foi possível atualizar o status de mensagem em lote. Tente novamente.');
    } finally {
      setBulkMessageStatusAction(null);
    }
  };

  const handleEditSignature = (signature: Signature) => {
    setEditingSignature(signature);
    setShowEditSignature(true);
    setEditSignatureErrors({});
  };

  const handleUpdateSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petition || !editingSignature) return;

    const errors: { [key: string]: string } = {};
    
    const nameError = validateName(editingSignature.name);
    if (nameError) errors.name = nameError;
    
    const phoneError = validatePhone(editingSignature.phone);
    if (phoneError) errors.phone = phoneError;
    
    const stateError = validateState(editingSignature.state || '');
    if (stateError) errors.state = stateError;
    
    const zipCodeError = validateZipCode(editingSignature.zipCode || '');
    if (zipCodeError) errors.zipCode = zipCodeError;

    // Check for duplicate phone (excluding current signature)
    const normalizedPhone = normalizePhone(editingSignature.phone);
    const isDuplicate = await checkPhoneDuplicate(petition.id, normalizedPhone, editingSignature.id);
    if (isDuplicate) {
      errors.phone = 'Este telefone já foi cadastrado neste abaixo-assinado';
    }

    if (Object.keys(errors).length > 0) {
      setEditSignatureErrors(errors);
      return;
    }

    try {
      const updated = await updateSignature(editingSignature.id, {
        name: editingSignature.name.trim(),
        phone: normalizedPhone,
        street: editingSignature.street?.trim() || undefined,
        neighborhood: editingSignature.neighborhood?.trim() || undefined,
        city: editingSignature.city?.trim() || undefined,
        state: editingSignature.state?.toUpperCase() || undefined,
        zipCode: editingSignature.zipCode?.replace(/\D/g, '') || undefined,
      });

      if (updated) {
        setSignatures(prev => prev.map(sig => 
          sig.id === editingSignature.id ? updated : sig
        ));
        setShowEditSignature(false);
        setEditingSignature(null);
        setEditSignatureErrors({});
      }
    } catch (error) {
      console.error('Error updating signature:', error);
      setEditSignatureErrors({ general: 'Erro ao atualizar assinatura. Tente novamente.' });
    }
  };

  const handleDeleteSignature = async (signatureId: string, signatureName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a assinatura de "${signatureName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingSignatureId(signatureId);
    try {
      const success = await deleteSignature(signatureId);
      if (success) {
        setSignatures(prev => prev.filter(sig => sig.id !== signatureId));
      } else {
        alert('Erro ao excluir a assinatura. Tente novamente.');
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      alert('Erro ao excluir a assinatura. Tente novamente.');
    } finally {
      setDeletingSignatureId(null);
    }
  };

  const handleUpdatePetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petition) return;

    const errors: { [key: string]: string } = {};
    const nameError = validateName(editName);
    if (nameError) errors.name = nameError;
    const signatureGoalValue = editSignatureGoal.trim() ? Number(editSignatureGoal) : undefined;
    if (petition.availableOnline && !editSignatureGoal.trim()) {
      errors.signatureGoal = 'Defina uma meta de assinaturas para manter a campanha online.';
    } else if (editSignatureGoal.trim() && (!Number.isInteger(signatureGoalValue) || signatureGoalValue < 1)) {
      errors.signatureGoal = 'A meta de assinaturas deve ser um número inteiro maior ou igual a 1.';
    }

    if (Object.keys(errors).length > 0) {
      if (errors.name) {
        showAvailabilityFeedback('error', errors.name);
      } else if (errors.signatureGoal) {
        showAvailabilityFeedback('error', errors.signatureGoal);
      }

      setEditSignatureGoalError(errors.signatureGoal || '');
      return;
    }

    const nextImageCandidate = editImageFile ? 'pending-image' : imagePreview;
    const nextPublicationReady = isPublicationReady({
      name: editName,
      slug: petition.slug,
      description: editDescription,
      signatureGoal: signatureGoalValue,
      imageUrl: nextImageCandidate,
      isSlugUnique: true,
    });

    if (petition.availableOnline && !nextPublicationReady) {
      showAvailabilityFeedback(
        'error',
        'A página pública está ativa. Complete o checklist mínimo, incluindo a meta, antes de salvar as alterações.'
      );
      return;
    }

    try {
      setIsUploadingImage(true);
      
      let newImageUrl = editImageUrl;
      
      // Se há uma nova imagem para upload
      if (editImageFile) {
        // Se já existe uma imagem anterior, deletar do storage
        if (petition.imageUrl) {
          await deleteImage(petition.imageUrl);
        }
        
        // Fazer upload da nova imagem
        const uploadResult = await uploadImage(editImageFile);
        if (uploadResult.success && uploadResult.url) {
          newImageUrl = uploadResult.url;
          setUploadError('');
        } else {
          console.error('Erro ao fazer upload da imagem:', uploadResult.error);
          setUploadError(uploadResult.error || 'Erro ao fazer upload da imagem');
          setIsUploadingImage(false);
          return;
        }
      }
      
      // Se a imagem foi removida (imagePreview é undefined mas havia uma imagem antes)
      if (!imagePreview && petition.imageUrl) {
        await deleteImage(petition.imageUrl);
        newImageUrl = undefined;
      }

      const updates = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        location: editLocation.trim() || undefined,
        collectionDate: editCollectionDate ? new Date(editCollectionDate) : undefined,
        responsible: editResponsible.trim() || undefined,
        imageUrl: newImageUrl,
        signatureGoal: signatureGoalValue,
      };

      const updatedPetition = await updatePetition(petition.id, updates);
      if (updatedPetition) {
        setPetition(updatedPetition);
        showAvailabilityFeedback('success', 'Dados da campanha atualizados com sucesso.');
        setEditSignatureGoalError('');
        setEditImageFile(null);
        setEditImageUrl(updatedPetition.imageUrl);
        setImagePreview(updatedPetition.imageUrl);
        setIsEditing(false);
        clearFormDraft(getPetitionDraftKey(petition.id, 'settings'));
      }
    } catch (error) {
      console.error('Error updating petition:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handler para upload de imagem
  const handleImageUpload = (file: File) => {
    setEditImageFile(file);
    setUploadError(''); // Limpar erro anterior
    // Criar preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handler para remover imagem
  const handleImageRemove = () => {
    setEditImageFile(null);
    setImagePreview(undefined);
    setEditImageUrl(undefined);
    setUploadError('');
  };

  const handleToggleOnlineAvailability = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!petition) return;
    
    const newAvailability = e.target.checked;

    if (newAvailability) {
      const canPublish = isPublicationReady({
        name: petition.name,
        slug: petition.slug,
        description: petition.description,
        signatureGoal: petition.signatureGoal,
        imageUrl: petition.imageUrl,
        isSlugUnique: true,
      });

      if (!canPublish) {
        showAvailabilityFeedback(
          'error',
          'Complete título, descrição mínima, meta e capa antes de liberar a página pública.'
        );
        setActiveTab('settings');
        return;
      }
    }
    
    try {
      const updatedPetition = await updatePetition(petition.id, {
        availableOnline: newAvailability
      });

      if (updatedPetition) {
        setPetition(updatedPetition);
        if (newAvailability) {
          showAvailabilityFeedback('success', `Página pública ativada: ${getPublicPetitionUrl(petition.slug)}`);
        } else {
          showAvailabilityFeedback('info', 'Página pública removida da disponibilidade online.');
        }
      }
    } catch (error) {
      console.error('Error toggling online availability:', error);
      showAvailabilityFeedback('error', 'Erro ao alterar disponibilidade online. Tente novamente.');
      return;
    }
  };

  const handleCEPChange = async (cep: string) => {
    const formattedCEP = formatCEP(cep);
    setNewSignature(prev => ({ ...prev, zipCode: formattedCEP }));
    
    // Only fetch address if CEP has 8 digits
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      try {
        const address = await fetchAddressByCEP(cleanCEP);
        if (address) {
          setNewSignature(prev => ({
            ...prev,
            street: address.logradouro || '',
            neighborhood: address.bairro || '',
            city: address.localidade || '',
            state: address.uf || ''
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  const handleEditCEPChange = async (cep: string) => {
    if (!editingSignature) return;
    
    const formattedCEP = formatCEP(cep);
    setEditingSignature(prev => prev ? { ...prev, zipCode: formattedCEP } : null);
    
    // Only fetch address if CEP has 8 digits
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      try {
        const address = await fetchAddressByCEP(cleanCEP);
        if (address && editingSignature) {
          setEditingSignature(prev => prev ? {
            ...prev,
            street: address.logradouro || '',
            neighborhood: address.bairro || '',
            city: address.localidade || '',
            state: address.uf || ''
          } : null);
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  const handleAddressSelect = (address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }) => {
    console.log('Endereço selecionado:', address);
    
    setNewSignature(prev => ({
      ...prev,
      street: address.street || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || ''
    }));
    
    // Limpar o campo de endereço após seleção
    setAddressInput('');
  };

  const handleExport = () => {
    if (!petition || signatures.length === 0) return;
    exportToCSV(signatures, `assinaturas-${petition.slug}`);
  };

  const handleExportBlankDocument = () => {
    if (!petition) return;

    const htmlContent = generateBlankSignatureDocument(petition);
    downloadHtmlDocument(htmlContent, `coleta-assinaturas-${petition.slug}.html`);
  };

  const handleExportPublicSectorDocument = () => {
    if (!petition || signatures.length === 0) return;

    const htmlContent = generatePublicSectorPresentationDocument(petition, signatures);
    downloadHtmlDocument(htmlContent, `apresentacao-setor-publico-${petition.slug}.html`);
  };

  const handleCreateKanbanTask = async () => {
    if (!petition) return;

    setIsCreatingTask(true);
    try {
      await createKanbanTaskForPetition(petition.id, petition.name, petition.description || '');
      setHasTask(true);
      alert('✅ Tarefa Kanban criada com sucesso! Você pode visualizá-la na página de Tarefas Globais.');
    } catch (error) {
      console.error('Error creating Kanban task:', error);
      alert('❌ Erro ao criar tarefa Kanban. Verifique se o board global e a coluna "Coleta de assinaturas" existem.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const generateBlankSignatureDocument = (petition: Petition): string => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coleta de Assinaturas - ${petition.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 10px 20px;
            line-height: 1.2;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 71px;
            position: relative;
        }
        .logo {
            position: absolute;
            left: 0;
            top: 0;
            width: 113px;
            height: 113px;
        }
        .header-right {
            position: absolute;
            right: 0;
            top: 0;
            font-size: 13px;
            font-weight: bold;
        }
        .header h1 {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
        }
        .header h2 {
            margin: 8px 0 0 0;
            font-size: 14px;
            font-weight: normal;
        }
        .info {
            margin-bottom: 10px;
            font-size: 17px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th, td {
            border: 1px solid #333;
            padding: 6px 3px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 11px;
        }
        td {
            height: 22px;
            font-size: 9px;
        }
        .signature-col {
            width: 25%;
        }
        .name-col {
            width: 25%;
        }
        .address-col {
            width: 25%;
        }
        .phone-col {
            width: 25%;
        }
        .terms {
            margin-top: 15px;
            padding: 15px;
            border: 1px solid #333;
            background-color: #f9f9f9;
            font-size: 15px;
            line-height: 1.4;
        }
        .terms h3 {
            margin: 0 0 12px 0;
            font-size: 17px;
        }
        .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 8px;
            color: #666;
        }
        @media print {
            body { margin: 5px 15px; }
            .header { margin-bottom: 10px; padding-bottom: 61px; }
            .header h1 { font-size: 14px; }
            .header h2 { font-size: 12px; }
            .logo { width: 95px; height: 95px; }
            .header-right { font-size: 12px; }
            .info { font-size: 15px; margin-bottom: 8px; }
            table { margin-bottom: 10px; }
            .terms { font-size: 13px; margin-top: 10px; padding: 12px; }
            .terms h3 { font-size: 15px; margin-bottom: 10px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="https://cdn.freebiesupply.com/logos/large/2x/prefeitura-municipal-de-joinville-logo-png-transparent.png" 
                 alt="Prefeitura Municipal de Joinville" 
                 style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div class="header-right">
            <p>Data de impressão: ${currentDate}</p>
        </div>
        <h1>ABAIXO-ASSINADO</h1>
        <h2>${petition.name}</h2>
    </div>

    <div class="info">
        <p><strong>Descrição:</strong> ${petition.description || 'Não informada'}</p>
        ${petition.location ? `<p><strong>Local:</strong> ${petition.location}</p>` : ''}
    </div>

    <table>
        <thead>
            <tr>
                <th class="name-col">NOME COMPLETO</th>
                <th class="address-col">RUA E Nº DA RESIDÊNCIA</th>
                <th class="phone-col">TELEFONE</th>
                <th class="signature-col">ASSINATURA</th>
            </tr>
        </thead>
        <tbody>
            ${Array(10).fill(0).map(() => `
            <tr>
                <td class="name-col">&nbsp;</td>
                <td class="address-col">&nbsp;</td>
                <td class="phone-col">&nbsp;</td>
                <td class="signature-col">&nbsp;</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="terms">
        <h3>TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS (LGPD)</h3>
        <p>
            Ao assinar este abaixo-assinado, você autoriza o tratamento dos seus dados pessoais 
            informados neste formulário, de forma exclusiva, para fins de comunicação relacionados 
            à <strong>"${petition.name}"</strong>, incluindo atualizações, convites, avisos e 
            informações desta campanha comunitária.
        </p>
        <p>
            Os dados coletados serão utilizados exclusivamente para os fins desta campanha e 
            não serão compartilhados com terceiros sem o seu consentimento expresso. Você pode 
            solicitar a exclusão dos seus dados a qualquer momento.
        </p>
    </div>

</body>
</html>
    `.trim();
  };

  const filteredSignatures = signatures.filter(signature => {
    const matchesSearch = 
      signature.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      signature.phone.includes(debouncedSearchTerm) ||
      (signature.city && signature.city.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    
    const matchesCity = !cityFilter || 
      (signature.city && signature.city.toLowerCase().includes(cityFilter.toLowerCase()));
    
    const matchesState = !stateFilter || 
      (signature.state && signature.state.toLowerCase() === stateFilter.toLowerCase());
    
    return matchesSearch && matchesCity && matchesState;
  });

  const totalPages = Math.ceil(filteredSignatures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSignatures = filteredSignatures.slice(startIndex, startIndex + itemsPerPage);

  const uniqueCities = Array.from(new Set(signatures.map(s => s.city).filter(Boolean))).sort();
  const uniqueStates = Array.from(new Set(signatures.map(s => s.state).filter(Boolean))).sort();
  const availableTabs = [
    canViewSignatures
      ? { key: 'signatures' as const, label: 'Assinaturas', icon: Users }
      : null,
    { key: 'links' as const, label: canManageResources ? 'Links e recursos' : 'Materiais', icon: ExternalLink },
    canViewPetitionSettings
      ? { key: 'settings' as const, label: 'Configurações', icon: Settings }
      : null,
    canExportSignatures
      ? { key: 'export' as const, label: 'Exportar', icon: Download }
      : null,
  ].filter(Boolean) as { key: 'signatures' | 'settings' | 'export' | 'links'; label: string; icon: typeof Users }[];

  const activeTabIsAvailable = availableTabs.some((tab) => tab.key === activeTab);

  useEffect(() => {
    if (!activeTabIsAvailable && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].key);
    }
  }, [activeTabIsAvailable, availableTabs]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!petition) {
    return <div className="flex justify-center py-8 text-gray-900 dark:text-gray-100">Abaixo-assinado não encontrado</div>;
  }

  const petitionPublicationChecklist = getPublicationChecklist({
    name: petition.name,
    slug: petition.slug,
    description: petition.description,
    signatureGoal: petition.signatureGoal,
    imageUrl: petition.imageUrl,
    isSlugUnique: true,
  });
  const petitionPublicationReady = isPublicationReady({
    name: petition.name,
    slug: petition.slug,
    description: petition.description,
    signatureGoal: petition.signatureGoal,
    imageUrl: petition.imageUrl,
    isSlugUnique: true,
  });

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/petitions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft size={20} />
          Voltar para lista
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{petition.name}</h1>
              {hasTask === false && canCreateKanbanTask && (
                <button
                  onClick={handleCreateKanbanTask}
                  disabled={isCreatingTask}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Criar tarefa Kanban para este abaixo-assinado"
                >
                  {isCreatingTask ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Criar Tarefa Kanban
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1">
                <Users size={16} />
                {signatures.length} assinaturas
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                Cadastrado em {petition.createdAt.toLocaleDateString('pt-BR')}
              </span>
              {petition.location && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {petition.location}
                </span>
              )}
              {petition.collectionDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Coletado em {petition.collectionDate.toLocaleDateString('pt-BR')} - como ID: 
                  <span className="flex items-center gap-1 ml-1">
                    {petition.id}
                    <button
                      onClick={() => {
                        void handleCopyToClipboard(petition.id, 'ID copiado para a área de transferência.');
                      }}
                      className="ml-1 p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copiar ID"
                    >
                      <Copy size={14} />
                    </button>
                  </span>
                </span>
              )}
            </div>
          </div>
          {petition.imageUrl && (
            <div className="ml-6">
              <img
                src={petition.imageUrl}
                alt={petition.name}
                className="w-32 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {availabilityFeedback && (
        <div
          className={`mb-6 rounded-lg border p-3 text-sm ${
            availabilityFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : availabilityFeedback.type === 'info'
                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {availabilityFeedback.message}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map(({ key, label, icon: Icon }) => {
            return (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'signatures' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assinaturas ({signatures.length})</h2>
            {canCreateManualSignature ? (
              <button
                onClick={() => setShowAddSignature(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Digitalizar Assinatura
              </button>
            ) : null}
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Todas as cidades</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Todos os UFs</option>
                  {uniqueStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            {canUpdateMessageStatus ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Aplicar nos filtros atuais: <strong>{filteredSignatures.length}</strong> assinatura(s).
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleBulkMessageStatusUpdate(true)}
                    disabled={filteredSignatures.length === 0 || bulkMessageStatusAction !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bulkMessageStatusAction === 'sent' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Marcar filtradas como Sim
                  </button>
                  <button
                    onClick={() => handleBulkMessageStatusUpdate(false)}
                    disabled={filteredSignatures.length === 0 || bulkMessageStatusAction !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
                  >
                    {bulkMessageStatusAction === 'unsent' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Marcar filtradas como Não
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Signatures List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {paginatedSignatures.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {filteredSignatures.length === 0 && searchTerm 
                    ? 'Nenhum resultado encontrado' 
                    : 'Nenhuma assinatura digitalizada'
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {filteredSignatures.length === 0 && searchTerm 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Digite a primeira assinatura deste abaixo-assinado físico'
                  }
                </p>
                {!searchTerm && canCreateManualSignature && (
                  <button
                    onClick={() => setShowAddSignature(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Digitalizar Assinatura
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Assinante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Localização
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Mensagem Enviada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Data de Cadastro
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedSignatures.map((signature) => (
                        <tr key={signature.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <User size={16} className="text-gray-400 dark:text-gray-500 mr-2" />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {signature.name}
                                </span>
                              </div>
                              {canEditSignatures ? (
                                <button
                                  onClick={() => handleEditSignature(signature)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Editar assinante"
                                >
                                  <Edit3 size={14} />
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                              <Phone size={16} className="text-gray-400 dark:text-gray-500 mr-2" />
                              {formatPhone(signature.phone)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {signature.street && (
                                <div>{signature.street}</div>
                              )}
                              <div className="flex items-center">
                                <MapPin size={14} className="text-gray-400 dark:text-gray-500 mr-1" />
                                {[signature.neighborhood, signature.city, signature.state]
                                  .filter(Boolean)
                                  .join(', ') || 'Não informado'}
                              </div>
                              {signature.zipCode && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  CEP: {signature.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!canUpdateMessageStatus) {
                                    return;
                                  }
                                  handleToggleMessageStatus(signature.id, !(signature.mensagemEnviada || false));
                                }}
                                disabled={!canUpdateMessageStatus}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                  (signature.mensagemEnviada || false)
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={(signature.mensagemEnviada || false) ? 'Marcar como não enviada' : 'Marcar como enviada'}
                              >
                                {(signature.mensagemEnviada || false) ? (
                                  <>
                                    <CheckCircle size={12} />
                                    Sim
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={12} />
                                    Não
                                  </>
                                )}
                              </button>
                              {isValidWhatsAppNumber(signature.phone) && (
                                <a
                                  href={generateBotConversaUrl(signature.phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-full text-xs font-medium hover:bg-green-700 transition-colors"
                                  title="Abrir no BotConversa"
                                >
                                  <MessageCircle size={12} />
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {signature.createdAt.toLocaleDateString('pt-BR')}
                              </span>
                              {canDeleteSignatures ? (
                                <button
                                  onClick={() => handleDeleteSignature(signature.id, signature.name)}
                                  disabled={deletingSignatureId === signature.id}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Excluir assinatura"
                                >
                                  {deletingSignatureId === signature.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredSignatures.length}
                  itemsPerPage={itemsPerPage}
                />
              </>
            )}
          </div>
        </div>
      )}


      {activeTab === 'links' && petition && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Links (YouTube / Google Drive)</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {canManageResources
                ? 'Cadastre materiais relacionados ao tema.'
                : 'Consulte os materiais da campanha. A edição de links exige permissão específica.'}
            </p>
          </div>

          {canManageResources ? (
            <form
            onSubmit={async (e) => {
              e.preventDefault();
              setResourceError('');
              
              if (!newResourceUrl.trim()) {
                setResourceError('Por favor, informe a URL do link');
                return;
              }

              // Validar URL básica
              try {
                new URL(newResourceUrl.trim());
              } catch {
                setResourceError('URL inválida. Por favor, verifique o formato da URL');
                return;
              }

              setIsAddingResource(true);
              
              try {
                const created = await addPetitionResource(petition.id, {
                  type: newResourceType,
                  title: newResourceTitle.trim() || undefined,
                  url: newResourceUrl.trim(),
                });
                
                if (created) {
                  setResources((prev) => [created, ...prev]);
                  setNewResourceTitle('');
                  setNewResourceUrl('');
                  setNewResourceType('link');
                  setResourceError('');
                  clearFormDraft(getPetitionDraftKey(petition.id, 'resources'));
                } else {
                  setResourceError('Erro ao adicionar o link. Verifique se você tem permissão ou se a tabela existe no banco de dados.');
                }
              } catch (error: any) {
                console.error('Error adding resource:', error);
                setResourceError(error?.message || 'Erro ao adicionar o link. Tente novamente.');
              } finally {
                setIsAddingResource(false);
              }
            }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={newResourceType}
                  onChange={(e) => setNewResourceType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="link">Link</option>
                  <option value="youtube">YouTube</option>
                  <option value="drive">Google Drive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título (opcional)</label>
                <input
                  type="text"
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Ex.: Vídeo explicativo"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                <input
                  type="url"
                  required
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Cole a URL (YouTube ou Drive)"
                />
              </div>
            </div>
            {resourceError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{resourceError}</p>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button 
                type="submit"
                disabled={isAddingResource || !newResourceUrl.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAddingResource ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adicionando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </button>
            </div>
            </form>
          ) : null}

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {resources.length === 0 ? (
              <div className="p-6 text-gray-600 dark:text-gray-300">Nenhum link cadastrado ainda.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {resources.map((r) => (
                  <li key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.title || r.type.toUpperCase()}</div>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-sm break-all flex items-center gap-1">
                        <ExternalLink size={14} /> {r.url}
                      </a>
                    </div>
                    {canManageResources ? (
                      <button
                        onClick={async () => {
                          const ok = await deletePetitionResource(r.id);
                          if (ok) setResources((prev) => prev.filter((x) => x.id !== r.id));
                        }}
                        className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                      >
                        Remover
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informações Básicas</h3>
              {canEditPetition ? (
                <button
                  onClick={() => {
                    if (isEditing) {
                      resetPetitionSettingsForm();
                      return;
                    }

                    setIsEditing(true);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Edit3 size={16} />
                  {isEditing ? 'Cancelar' : 'Editar'}
                </button>
              ) : null}
            </div>

            {!canEditPetition ? (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                Seu acesso permite consultar esta campanha, mas nao editar os dados basicos.
              </div>
            ) : null}

            {isEditing ? (
              <form onSubmit={handleUpdatePetition} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Abaixo-Assinado
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Local da Coleta
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data da Coleta
                    </label>
                    <input
                      type="date"
                      value={editCollectionDate}
                      onChange={(e) => setEditCollectionDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Responsável pela Coleta
                  </label>
                  <input
                    type="text"
                    value={editResponsible}
                    onChange={(e) => setEditResponsible(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {petition?.availableOnline ? 'Meta de assinaturas *' : 'Meta de assinaturas (opcional)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required={petition?.availableOnline}
                    value={editSignatureGoal}
                    onChange={(e) => {
                      setEditSignatureGoal(e.target.value);
                      if (editSignatureGoalError) {
                        setEditSignatureGoalError('');
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                      editSignatureGoalError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex.: 500"
                  />
                  {editSignatureGoalError ? (
                    <p className="text-red-600 text-sm mt-1 dark:text-red-400">{editSignatureGoalError}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                      {petition?.availableOnline
                        ? 'Obrigatória para manter a campanha online.'
                        : 'Defina o total de assinaturas esperado.'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capa da página pública
                  </label>
                    <ImageUpload
                      onImageUpload={handleImageUpload}
                      onImageRemove={handleImageRemove}
                      currentImage={imagePreview}
                      maxSize={5}
                      acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                      recommendedAspectRatio={16 / 9}
                      recommendedAspectLabel="16:9"
                      recommendedResolution="1200 x 675 px"
                    />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {petition?.availableOnline
                      ? 'Esta imagem será exibida na página pública de assinatura online.'
                      : 'Você pode enviar a capa agora e ativar a página pública depois.'}
                  </p>
                  {!petition?.availableOnline && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        A campanha ainda está offline, mas a capa já pode ser preparada para completar o checklist de publicação.
                      </p>
                    </div>
                  )}
                  {uploadError && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {uploadError}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUploadingImage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetPetitionSettingsForm}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                  <p className="text-gray-900 dark:text-gray-100">{petition.name}</p>
                </div>
                {petition.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                    <p className="text-gray-900 dark:text-gray-100">{petition.description}</p>
                  </div>
                )}
                {petition.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local da Coleta</label>
                    <p className="text-gray-900 dark:text-gray-100">{petition.location}</p>
                  </div>
                )}
                {petition.collectionDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data da Coleta</label>
                    <p className="text-gray-900 dark:text-gray-100">{petition.collectionDate.toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                {petition.responsible && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Responsável</label>
                    <p className="text-gray-900 dark:text-gray-100">{petition.responsible}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meta de assinaturas</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {petition.signatureGoal ? formatNumber(petition.signatureGoal) : '—'}
                  </p>
                  {!canPublishPetition ? (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                      Seu usuário não tem permissão para ligar ou desligar a página pública.
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Disponibilidade Online */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Disponibilidade Online</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="availableOnline"
                  checked={petition?.availableOnline || false}
                  onChange={handleToggleOnlineAvailability}
                  disabled={!canPublishPetition}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="availableOnline" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Disponibilizar para Assinatura Online
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Permite que as pessoas assinem este abaixo-assinado através de uma página pública na internet
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Checklist de publicação</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      A campanha só pode ficar online quando o mínimo público estiver completo.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      petitionPublicationReady
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}
                  >
                    {petitionPublicationReady ? 'Pronto para publicar' : 'Pendências de publicação'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {petitionPublicationChecklist.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      {item.complete ? (
                        <CheckCircle size={16} className="mt-0.5 text-emerald-600 dark:text-emerald-300" />
                      ) : (
                        <XCircle size={16} className="mt-0.5 text-amber-600 dark:text-amber-300" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!petition?.availableOnline && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Prévia do link público
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Quando o checklist estiver completo, esta será a URL usada para divulgação.
                  </p>
                  <input
                    type="text"
                    value={publicPetitionUrl}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-gray-700 dark:text-gray-300"
                  />
                </div>
              )}

              {petition?.availableOnline && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Página Pública Ativa
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                    As pessoas podem assinar este abaixo-assinado acessando o link abaixo:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={publicPetitionUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded text-sm text-gray-700 dark:text-gray-300"
                    />
                    <button
                      onClick={() => {
                        void handleCopyToClipboard(publicPetitionUrl, 'Link público copiado para a área de transferência.');
                      }}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Exportar Dados</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Formato CSV</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Exporte todas as assinaturas digitalizadas em formato CSV para análise ou backup.
                O arquivo incluirá: Nome, Telefone, Endereço, Mensagem Enviada e Data de Cadastro.
              </p>
              
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {signatures.length} assinaturas digitalizadas
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Arquivo: assinaturas-{petition.slug}.csv
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  disabled={signatures.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download size={16} />
                  Baixar CSV
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Documento para Apresentação ao Setor Público</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Gere um documento formatado para impressão e apresentação institucional, com a relação das assinaturas
                digitalizadas desta petição. O arquivo inclui nome completo, endereço e data e horário da assinatura,
                sem exibir telefone.
              </p>

              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {signatures.length} assinaturas digitalizadas
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Arquivo: apresentacao-setor-publico-{petition.slug}.html
                  </p>
                </div>
                <button
                  onClick={handleExportPublicSectorDocument}
                  disabled={signatures.length === 0}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FileText size={16} />
                  Baixar Documento
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Documento para Coleta Física</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Exporte um documento em branco para coleta de assinaturas físicas.
                O documento incluirá: Nome Completo, Rua e Nº da Residência, Telefone, Assinatura e Termo LGPD.
              </p>
              
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Documento em branco para impressão
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Arquivo: coleta-assinaturas-{petition.slug}.html
                  </p>
                </div>
                <button
                  onClick={handleExportBlankDocument}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FileText size={16} />
                  Baixar Documento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Signature Modal */}
      {showEditSignature && editingSignature && canEditSignatures && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar Assinante</h3>
                <button
                  onClick={() => {
                    setShowEditSignature(false);
                    setEditingSignature(null);
                    setEditSignatureErrors({});
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateSignature} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={editingSignature.name}
                    onChange={(e) => setEditingSignature(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                      editSignatureErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {editSignatureErrors.name && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{editSignatureErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefone WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={editingSignature.phone}
                    onChange={(e) => setEditingSignature(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    placeholder="(11) 99999-9999"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                      editSignatureErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {editSignatureErrors.phone && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{editSignatureErrors.phone}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Formato: DDD + 9 + 8 dígitos (ex: 11987654321)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingSignature.zipCode || ''}
                      onChange={(e) => handleEditCEPChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        editSignatureErrors.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } ${isLoadingCEP ? 'pr-10' : ''}`}
                    />
                    {isLoadingCEP && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {editSignatureErrors.zipCode && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{editSignatureErrors.zipCode}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    O endereço será preenchido automaticamente
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={editingSignature.street || ''}
                    onChange={(e) => setEditingSignature(prev => prev ? { ...prev, street: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Será preenchido automaticamente pelo CEP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={editingSignature.neighborhood || ''}
                    onChange={(e) => setEditingSignature(prev => prev ? { ...prev, neighborhood: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Será preenchido automaticamente pelo CEP"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={editingSignature.city || ''}
                      onChange={(e) => setEditingSignature(prev => prev ? { ...prev, city: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Será preenchido automaticamente pelo CEP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      UF
                    </label>
                    <input
                      type="text"
                      value={editingSignature.state || ''}
                      onChange={(e) => setEditingSignature(prev => prev ? { ...prev, state: e.target.value.toUpperCase() } : null)}
                      maxLength={2}
                      placeholder="Preenchido pelo CEP"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        editSignatureErrors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {editSignatureErrors.state && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{editSignatureErrors.state}</p>
                    )}
                  </div>
                </div>

                {editSignatureErrors.general && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{editSignatureErrors.general}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSignature(false);
                      setEditingSignature(null);
                      setEditSignatureErrors({});
                    }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Signature Modal */}
      {showAddSignature && canCreateManualSignature && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Digitalizar Assinatura</h3>
                <button
                  onClick={() => {
                    setShowAddSignature(false);
                    setSignatureErrors({});
                    setAddressInput('');
                    setNewSignature({
                      name: '',
                      phone: '',
                      street: '',
                      neighborhood: '',
                      city: '',
                      state: '',
                      zipCode: ''
                    });
                    if (petition) {
                      clearFormDraft(getPetitionDraftKey(petition.id, 'signature'));
                    }
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddSignature} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newSignature.name}
                    onChange={(e) => setNewSignature(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                      signatureErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {signatureErrors.name && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{signatureErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefone WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={newSignature.phone}
                    onChange={(e) => setNewSignature(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                      signatureErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {signatureErrors.phone && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{signatureErrors.phone}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Formato: DDD + 9 + 8 dígitos (ex: 11987654321)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço
                  </label>
                  
                  {/* Opção 1: Busca por CEP */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Buscar por CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newSignature.zipCode}
                        onChange={(e) => handleCEPChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                          signatureErrors.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } ${isLoadingCEP ? 'pr-10' : ''}`}
                      />
                      {isLoadingCEP && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    {signatureErrors.zipCode && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{signatureErrors.zipCode}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Digite o CEP para preenchimento automático
                    </p>
                  </div>

                  {/* Opção 2: Busca por Endereço (Google Places) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Buscar por Endereço
                    </label>
                    <AddressAutocomplete
                      value={addressInput}
                      onChange={setAddressInput}
                      onAddressSelect={handleAddressSelect}
                      placeholder="Digite o endereço completo..."
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={newSignature.street}
                    onChange={(e) => setNewSignature(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Será preenchido automaticamente pelo CEP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={newSignature.neighborhood}
                    onChange={(e) => setNewSignature(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Será preenchido automaticamente pelo CEP"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={newSignature.city}
                      onChange={(e) => setNewSignature(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Será preenchido automaticamente pelo CEP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      UF
                    </label>
                    <input
                      type="text"
                      value={newSignature.state}
                      onChange={(e) => setNewSignature(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      maxLength={2}
                      placeholder="Preenchido pelo CEP"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        signatureErrors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {signatureErrors.state && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{signatureErrors.state}</p>
                    )}
                  </div>
                </div>

                {signatureErrors.general && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{signatureErrors.general}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Salvar Assinatura
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSignature(false);
                      setSignatureErrors({});
                      setAddressInput('');
                      setNewSignature({
                        name: '',
                        phone: '',
                        street: '',
                        neighborhood: '',
                        city: '',
                        state: '',
                        zipCode: '',
                      });
                      if (petition) {
                        clearFormDraft(getPetitionDraftKey(petition.id, 'signature'));
                      }
                    }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

