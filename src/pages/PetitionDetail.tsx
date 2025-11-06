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
  Trash2
} from 'lucide-react';
import { 
  getPetitionById, 
  getSignaturesByPetition, 
  updatePetition, 
  saveSignature, 
  checkPhoneDuplicate,
  updateSignatureMessageStatus,
  updateSignature,
  deleteSignature
} from '../utils/supabase-storage';
import { generateBotConversaUrl, isValidWhatsAppNumber } from '../utils/whatsapp-utils';
import { exportToCSV } from '../utils/export';
import { Petition, Signature, PetitionResource } from '../types';
import { validateName, validatePhone, validateState, validateZipCode, normalizePhone, formatPhone } from '../utils/validation';
import { fetchAddressByCEP, formatCEP } from '../utils/cep';
import { Pagination } from '../components/Pagination';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { useDebounce } from '../hooks/useDebounce';
import { getPetitionResources, addPetitionResource, deletePetitionResource } from '../utils/supabase-storage';

export const PetitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [petition, setPetition] = useState<Petition | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [activeTab, setActiveTab] = useState<'signatures' | 'settings' | 'export' | 'links'>('signatures');
  const [showAddSignature, setShowAddSignature] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // New signature form state
  const [newSignature, setNewSignature] = useState({
    name: '',
    phone: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [signatureErrors, setSignatureErrors] = useState<{ [key: string]: string }>({});
  const [editingSignatureId, setEditingSignatureId] = useState<string | null>(null);
  const [editingSignatureName, setEditingSignatureName] = useState<string>('');
  const [showEditSignature, setShowEditSignature] = useState(false);
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const [editSignatureErrors, setEditSignatureErrors] = useState<{ [key: string]: string }>({});
  const [deletingSignatureId, setDeletingSignatureId] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('');

  // Links
  const [resources, setResources] = useState<PetitionResource[]>([]);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'youtube' | 'drive' | 'link'>('link');
  const [resourceError, setResourceError] = useState<string>('');
  const [isAddingResource, setIsAddingResource] = useState(false);

  // Settings form state
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCollectionDate, setEditCollectionDate] = useState('');
  const [editResponsible, setEditResponsible] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
        setEditName(currentPetition.name);
        setEditDescription(currentPetition.description || '');
        setEditLocation(currentPetition.location || '');
        setEditCollectionDate(currentPetition.collectionDate ? currentPetition.collectionDate.toISOString().split('T')[0] : '');
        setEditResponsible(currentPetition.responsible || '');
        
        const petitionSignatures = await getSignaturesByPetition(currentPetition.id);
        setSignatures(petitionSignatures);

        // Carregar links
        const r = await getPetitionResources(currentPetition.id);
        setResources(r);
      } catch (error) {
        console.error('Error loading petition data:', error);
        navigate('/petitions');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

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

    if (Object.keys(errors).length > 0) {
      return;
    }

    const updates = {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      location: editLocation.trim() || undefined,
      collectionDate: editCollectionDate ? new Date(editCollectionDate) : undefined,
      responsible: editResponsible.trim() || undefined,
    };

    try {
      const updatedPetition = await updatePetition(petition.id, updates);
      if (updatedPetition) {
        setPetition(updatedPetition);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating petition:', error);
    }
  };

  const handleToggleOnlineAvailability = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!petition) return;
    
    const newAvailability = e.target.checked;
    
    try {
      const updatedPetition = await updatePetition(petition.id, {
        availableOnline: newAvailability
      });

      if (updatedPetition) {
        setPetition(updatedPetition);
        
        // Mostrar mensagem de sucesso
        if (newAvailability) {
          alert(`✅ Abaixo-assinado disponibilizado online!\n\nLink público: ${window.location.origin}/petition/${petition.slug}`);
        } else {
          alert('✅ Abaixo-assinado removido da disponibilidade online.');
        }
      }
    } catch (error) {
      console.error('Error toggling online availability:', error);
      alert('❌ Erro ao alterar disponibilidade online. Tente novamente.');
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
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `coleta-assinaturas-${petition.slug}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{petition.name}</h1>
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
                  Coletado em {petition.collectionDate.toLocaleDateString('pt-BR')}
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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'signatures', label: 'Assinaturas', icon: Users },
            { key: 'links', label: 'Links', icon: ExternalLink },
            { key: 'settings', label: 'Configurações', icon: Settings },
            { key: 'export', label: 'Exportar', icon: Download },
          ].map(({ key, label, icon: Icon }) => (
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
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'signatures' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assinaturas ({signatures.length})</h2>
            <button
              onClick={() => setShowAddSignature(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Digitalizar Assinatura
            </button>
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
                {!searchTerm && (
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
                              <button
                                onClick={() => handleEditSignature(signature)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Editar assinante"
                              >
                                <Edit3 size={14} />
                              </button>
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
                                  handleToggleMessageStatus(signature.id, !(signature.mensagemEnviada || false));
                                }}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
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
            <p className="text-gray-600 dark:text-gray-300 mt-1">Cadastre materiais relacionados ao tema.</p>
          </div>

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
                    <button
                      onClick={async () => {
                        const ok = await deletePetitionResource(r.id);
                        if (ok) setResources((prev) => prev.filter((x) => x.id !== r.id));
                      }}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Remover
                    </button>
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
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Edit3 size={16} />
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

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
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
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
                      value={`${window.location.origin}/petition/${petition.slug}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded text-sm text-gray-700 dark:text-gray-300"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/petition/${petition.slug}`);
                        alert('Link copiado para a área de transferência!');
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
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Documento para Coleta Física</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Exporte um documento em branco para coleta de assinaturas físicas.
                O documento incluirá: Nome Completo, Rua e Nº da Residência, Telefone, Assinatura e Termo LGPD.
              </p>
              
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Documento com 10 linhas em branco
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
      {showEditSignature && editingSignature && (
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
      {showAddSignature && (
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
                      setNewSignature({
                        name: '',
                        phone: '',
                        street: '',
                        neighborhood: '',
                        city: '',
                        state: '',
                        zipCode: '',
                      });
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