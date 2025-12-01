import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Users, MapPin, CheckCircle, AlertCircle, Check, X, Share2, Copy, MessageCircle } from 'lucide-react';
import { Petition, Signature } from '../types';
import { getPetitionBySlug, saveSignature, getSignaturesByPetition, checkPhoneDuplicate } from '../utils/supabase-storage';
import { validatePhone, normalizePhone } from '../utils/validation';

// Componente para atualizar meta tags dinamicamente
const updateMetaTags = (petition: Petition, signatureCount: number) => {
  const title = `${petition.name} - Abaixo-Assinado`;
  const description = petition.description || `Assine este abaixo-assinado e ajude a fazer a diferença. Já são ${signatureCount} assinaturas!`;
  const url = window.location.href;
  const image = petition.imageUrl || `${window.location.origin}/icon-512x512.png`;

  // Atualizar título da página
  document.title = title;

  // Função auxiliar para criar ou atualizar meta tag
  const setMetaTag = (property: string, content: string, isProperty = true) => {
    const attr = isProperty ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  // Meta tags básicas
  setMetaTag('description', description, false);
  setMetaTag('keywords', `abaixo-assinado, petição, ${petition.name}, cidadania, participação`, false);

  // Open Graph (Facebook, LinkedIn, etc.)
  setMetaTag('og:title', title);
  setMetaTag('og:description', description);
  setMetaTag('og:url', url);
  setMetaTag('og:image', image);
  setMetaTag('og:type', 'website');
  setMetaTag('og:site_name', 'Sistema de Abaixo-Assinados');

  // Twitter Card
  setMetaTag('twitter:card', 'summary_large_image', false);
  setMetaTag('twitter:title', title, false);
  setMetaTag('twitter:description', description, false);
  setMetaTag('twitter:image', image, false);
};

// Componente de botões de compartilhamento
const ShareButtons: React.FC<{ petition: Petition; signatureCount: number }> = ({ petition, signatureCount }) => {
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  const shareUrl = window.location.href;
  const shareText = `Assine o abaixo-assinado: ${petition.name}. Já são ${signatureCount} assinaturas! Sua participação faz a diferença.`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: petition.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShowShare(true);
        }
      }
    } else {
      setShowShare(true);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
      >
        <Share2 size={18} />
        <span className="hidden sm:inline">Compartilhar</span>
      </button>

      {showShare && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl p-4 z-50 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800">Compartilhar</span>
            <button 
              onClick={() => setShowShare(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-green-50 transition-colors group"
              title="WhatsApp"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle size={24} className="text-white" />
              </div>
              <span className="text-xs text-gray-600">WhatsApp</span>
            </button>
            
            <button
              onClick={shareFacebook}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
              title="Facebook"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-600">Facebook</span>
            </button>
            
            <button
              onClick={shareTwitter}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 transition-colors group"
              title="X (Twitter)"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-600">X</span>
            </button>
            
            <button
              onClick={shareTelegram}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
              title="Telegram"
            >
              <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-600">Telegram</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PublicPetition: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [petition, setPetition] = useState<Petition | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean | null;
    message: string;
    isChecking: boolean;
  }>({ isValid: null, message: '', isChecking: false });
  const [nameValidation, setNameValidation] = useState<{
    isValid: boolean | null;
    message: string;
  }>({ isValid: null, message: '' });

  useEffect(() => {
    if (slug) {
      loadPetition();
    }
  }, [slug]);

  const loadPetition = async () => {
    try {
      setLoading(true);
      const petitionData = await getPetitionBySlug(slug!);
      
      if (!petitionData) {
        setError('Abaixo-assinado não encontrado');
        return;
      }

      if (!petitionData.availableOnline) {
        setError('Este abaixo-assinado não está disponível para assinatura online');
        return;
      }

      setPetition(petitionData);
      
      // Debug: verificar URL da imagem
      if (petitionData.imageUrl) {
        console.log('Image URL:', petitionData.imageUrl);
        // Verificar se a URL é válida
        if (!petitionData.imageUrl.startsWith('http://') && !petitionData.imageUrl.startsWith('https://')) {
          console.warn('Image URL não é absoluta:', petitionData.imageUrl);
        }
      } else {
        console.log('Petition sem imagem');
      }
      
      // Carregar assinaturas para mostrar contador
      const signaturesData = await getSignaturesByPetition(petitionData.id);
      setSignatures(signaturesData);
      
      // Atualizar meta tags para SEO e compartilhamento
      updateMetaTags(petitionData, signaturesData.length);
    } catch (err) {
      console.error('Error loading petition:', err);
      setError('Erro ao carregar abaixo-assinado');
    } finally {
      setLoading(false);
    }
  };

  // Validação em tempo real do nome completo
  const validateNameRealTime = useCallback((name: string) => {
    const trimmedName = name.trim();
    
    // Se estiver vazio, resetar validação
    if (!trimmedName) {
      setNameValidation({ isValid: null, message: '' });
      return;
    }

    // Dividir o nome em partes (ignorando espaços extras)
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
    
    // Verificar quantidade de palavras
    if (nameParts.length < 2) {
      setNameValidation({ 
        isValid: false, 
        message: '⚠️ Digite seu nome completo (nome e sobrenome)' 
      });
      return;
    }

    // Verificar se cada parte tem pelo menos 2 caracteres
    const hasShortParts = nameParts.some(part => part.length < 2);
    if (hasShortParts) {
      setNameValidation({ 
        isValid: false, 
        message: '⚠️ O nome e sobrenome devem ter pelo menos 2 caracteres cada' 
      });
      return;
    }

    // Verificar se não são apenas letras repetidas (ex: "aaa bbb")
    const hasInvalidParts = nameParts.some(part => /^(.)\1+$/.test(part));
    if (hasInvalidParts) {
      setNameValidation({ 
        isValid: false, 
        message: '⚠️ Por favor, digite um nome válido' 
      });
      return;
    }

    // Nome válido
    setNameValidation({ 
      isValid: true, 
      message: '✅ Nome completo válido' 
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Validar nome em tempo real
    if (name === 'name') {
      validateNameRealTime(value);
    }
  };

  // Validação em tempo real do telefone
  const validatePhoneRealTime = useCallback(async (phone: string, petitionData: Petition | null) => {
    const cleanPhone = normalizePhone(phone);
    
    // Se estiver vazio, resetar validação
    if (!cleanPhone) {
      setPhoneValidation({ isValid: null, message: '', isChecking: false });
      return;
    }

    // Validação básica de formato
    const basicError = validatePhone(phone);
    
    if (basicError) {
      // Mostrar dicas progressivas enquanto digita
      if (cleanPhone.length < 2) {
        setPhoneValidation({ isValid: null, message: 'Digite o DDD (2 dígitos)', isChecking: false });
      } else if (cleanPhone.length < 3) {
        const ddd = parseInt(cleanPhone.substring(0, 2));
        if (ddd < 11 || ddd > 99) {
          setPhoneValidation({ isValid: false, message: 'DDD inválido (deve ser 11 a 99)', isChecking: false });
        } else {
          setPhoneValidation({ isValid: null, message: 'Digite o 9 (obrigatório para celular)', isChecking: false });
        }
      } else if (cleanPhone.length === 3 && cleanPhone.charAt(2) !== '9') {
        setPhoneValidation({ isValid: false, message: '❌ O número deve começar com 9 após o DDD', isChecking: false });
      } else if (cleanPhone.length < 11) {
        const remaining = 11 - cleanPhone.length;
        setPhoneValidation({ isValid: null, message: `Faltam ${remaining} dígito${remaining > 1 ? 's' : ''}`, isChecking: false });
      } else {
        setPhoneValidation({ isValid: false, message: basicError, isChecking: false });
      }
      return;
    }

    // Se o formato está correto, verificar duplicidade
    if (petitionData) {
      setPhoneValidation({ isValid: null, message: 'Verificando número...', isChecking: true });
      
      try {
        const isDuplicate = await checkPhoneDuplicate(petitionData.id, cleanPhone);
        if (isDuplicate) {
          setPhoneValidation({ 
            isValid: false, 
            message: '❌ Este número já assinou este abaixo-assinado', 
            isChecking: false 
          });
        } else {
          setPhoneValidation({ 
            isValid: true, 
            message: '✅ Número válido e disponível', 
            isChecking: false 
          });
        }
      } catch (err) {
        setPhoneValidation({ 
          isValid: true, 
          message: '✅ Formato válido', 
          isChecking: false 
        });
      }
    } else {
      setPhoneValidation({ isValid: true, message: '✅ Formato válido', isChecking: false });
    }
  }, []);

  // Handler específico para o campo de telefone com máscara
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remover tudo que não é número
    const numbersOnly = value.replace(/\D/g, '');
    
    // Limitar a 11 dígitos
    const limited = numbersOnly.slice(0, 11);
    
    // Aplicar máscara: (XX) XXXXX-XXXX
    let formatted = '';
    if (limited.length > 0) {
      formatted = '(' + limited.substring(0, 2);
    }
    if (limited.length >= 2) {
      formatted += ') ';
    }
    if (limited.length > 2) {
      formatted += limited.substring(2, 7);
    }
    if (limited.length > 7) {
      formatted += '-' + limited.substring(7, 11);
    }
    
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    // Limpar erro do campo
    if (formErrors.phone) {
      setFormErrors(prev => ({ ...prev, phone: '' }));
    }
    
    // Validar em tempo real
    validatePhoneRealTime(formatted, petition);
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    const formattedCEP = cep.replace(/(\d{5})(\d{3})/, '$1-$2'); // Formata como 00000-000
    
    setFormData(prev => ({ ...prev, zipCode: formattedCEP }));
    
    // Buscar endereço se CEP tem 8 dígitos
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const addressData = await response.json();
        
        if (!addressData.erro) {
          setFormData(prev => ({
            ...prev,
            street: addressData.logradouro || prev.street,
            neighborhood: addressData.bairro || prev.neighborhood,
            city: addressData.localidade || prev.city,
            state: addressData.uf || prev.state
          }));
        }
      } catch (error) {
        console.error('Erro buscando CEP:', error);
      }
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: { [key: string]: string } = {};

    // Validar nome completo (pelo menos 2 nomes)
    if (!formData.name.trim()) {
      errors.name = 'Nome completo é obrigatório';
      setNameValidation({ isValid: false, message: '⚠️ Nome é obrigatório' });
    } else {
      const nameParts = formData.name.trim().split(/\s+/).filter(part => part.length > 0);
      if (nameParts.length < 2) {
        errors.name = 'Digite seu nome completo (nome e sobrenome)';
        setNameValidation({ isValid: false, message: '⚠️ Digite seu nome completo (nome e sobrenome)' });
      } else {
        // Verificar se cada parte tem pelo menos 2 caracteres
        const hasShortParts = nameParts.some(part => part.length < 2);
        if (hasShortParts) {
          errors.name = 'O nome e sobrenome devem ter pelo menos 2 caracteres cada';
          setNameValidation({ isValid: false, message: '⚠️ O nome e sobrenome devem ter pelo menos 2 caracteres cada' });
        }
      }
    }

    // Validar telefone celular usando a validação existente
    if (!formData.phone.trim()) {
      errors.phone = 'Telefone celular é obrigatório';
    } else {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) {
        errors.phone = phoneError;
      } else if (petition) {
        // Verificar telefone duplicado (re-verificar no submit para garantir)
        const cleanPhone = normalizePhone(formData.phone);
        const isDuplicate = await checkPhoneDuplicate(petition.id, cleanPhone);
        if (isDuplicate) {
          errors.phone = 'Este número já foi cadastrado neste abaixo-assinado';
          setPhoneValidation({ 
            isValid: false, 
            message: '❌ Este número já assinou este abaixo-assinado', 
            isChecking: false 
          });
        }
      }
    }

    // Validar data de nascimento (obrigatório para assinatura online)
    if (!formData.birthDate) {
      errors.birthDate = 'Data de nascimento é obrigatória';
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const minDate = new Date('1900-01-01');
      
      if (birthDate > today) {
        errors.birthDate = 'Data de nascimento não pode ser no futuro';
      } else if (birthDate < minDate) {
        errors.birthDate = 'Data de nascimento inválida';
      } else {
        // Verificar se a pessoa tem pelo menos 16 anos (idade mínima para assinar)
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age;
        
        if (actualAge < 16) {
          errors.birthDate = 'É necessário ter pelo menos 16 anos para assinar';
        }
      }
    }

    // Validar consentimento LGPD
    if (!consentAccepted) {
      errors.consent = 'É necessário aceitar o termo de consentimento para assinar';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid || !petition) return;

    setSubmitting(true);
    setError('');

    try {
      const signatureData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        street: formData.street.trim() || undefined,
        neighborhood: formData.neighborhood.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zipCode: formData.zipCode.trim() || undefined,
      };

      const saved = await saveSignature(petition.id, signatureData);
      
      if (saved) {
        setSubmitted(true);
        // Atualizar contador
        setSignatures(prev => [...prev, saved]);
      } else {
        setError('Erro ao salvar assinatura. Verifique se todos os campos estão preenchidos corretamente e tente novamente.');
      }
    } catch (err: any) {
      console.error('Error saving signature:', err);
      const errorMessage = err?.message || err?.error?.message || 'Erro desconhecido';
      
      // Verificar se é erro de duplicata (do constraint UNIQUE no banco)
      if (errorMessage.includes('já assinou') || errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorMessage.includes('apenas uma vez')) {
        setError('Este número de telefone já foi utilizado para assinar este abaixo-assinado. Cada pessoa pode assinar apenas uma vez.');
        // Atualizar validação do telefone para mostrar o erro
        setPhoneValidation({ 
          isValid: false, 
          message: '❌ Este número já assinou este abaixo-assinado', 
          isChecking: false 
        });
      } else {
        setError(`Erro ao salvar assinatura: ${errorMessage}. Verifique sua conexão e tente novamente.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const shareUrl = window.location.href;
    const shareText = `Assine o abaixo-assinado: ${petition?.name}. Já são ${signatures.length} assinaturas! Sua participação faz a diferença.`;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Assinatura Registrada!</h1>
          <p className="text-gray-600 mb-6">
            Obrigado por apoiar esta causa. Sua assinatura foi registrada com sucesso.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>{signatures.length}</strong> pessoas já assinaram este abaixo-assinado
            </p>
          </div>
          
          {/* Botões de compartilhamento */}
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-4">
            <p className="text-sm font-semibold text-green-800 mb-4">
              Ajude a divulgar esta causa:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <MessageCircle size={18} />
                WhatsApp
              </button>
              <button
                onClick={() => {
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
                  window.open(url, '_blank', 'width=600,height=400');
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    alert('Link copiado para a área de transferência!');
                  } catch (err) {
                    console.error('Erro ao copiar:', err);
                  }
                }}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Copy size={18} />
                Copiar Link
              </button>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: '',
                phone: '',
                birthDate: '',
                street: '',
                neighborhood: '',
                city: '',
                state: '',
                zipCode: ''
              });
              setConsentAccepted(false);
              setPhoneValidation({ isValid: null, message: '', isChecking: false });
              setNameValidation({ isValid: null, message: '' });
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Assinar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 md:py-16 relative z-10">
          <div className="text-center">
            {/* Header com título */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 sm:mb-6">ABAIXO-ASSINADO</h1>
            
            {/* Imagem do abaixo-assinado */}
            {petition?.imageUrl && (
              <div className="mb-6 sm:mb-8 px-2 sm:px-4">
                <div className="relative mx-auto w-full max-w-2xl rounded-xl shadow-2xl border-4 border-white/20 overflow-hidden bg-white/10">
                  <img
                    src={petition.imageUrl}
                    alt={petition.name}
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '400px', minHeight: '200px' }}
                    onError={(e) => {
                      console.error('Erro ao carregar imagem:', petition.imageUrl);
                      const img = e.currentTarget;
                      const container = img.parentElement;
                      if (container) {
                        container.innerHTML = `
                          <div class="flex items-center justify-center p-8 text-white/80">
                            <div class="text-center">
                              <p class="text-sm mb-2">⚠️ Imagem não disponível</p>
                              <p class="text-xs opacity-70">Verifique as permissões do Storage</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                    onLoad={() => {
                      console.log('Imagem carregada com sucesso:', petition.imageUrl);
                    }}
                    loading="eager"
                  />
                </div>
              </div>
            )}
            
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 px-2 leading-tight">{petition?.name}</h2>
            
            {petition?.description && (
              <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-4 sm:mb-6 max-w-3xl mx-auto px-2 leading-relaxed">
                {petition.description}
              </p>
            )}

            {/* Botão de compartilhar abaixo da descrição */}
            {petition && (
              <div className="flex justify-center mb-6 sm:mb-8">
                <ShareButtons petition={petition} signatureCount={signatures.length} />
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-blue-100 mb-6">
              {petition?.location && (
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <MapPin size={18} className="flex-shrink-0" />
                  <span className="text-sm sm:text-base">{petition.location}</span>
                </div>
              )}
            </div>

            {/* Contador de assinaturas - destaque */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 sm:mt-6">
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 px-6 sm:px-8 py-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Users size={28} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-3xl sm:text-4xl font-bold">{signatures.length}</div>
                    <div className="text-sm sm:text-base font-medium text-blue-100">assinaturas</div>
                  </div>
                </div>
              </div>
              
              {/* CTA mobile */}
              <a 
                href="#assinar" 
                className="sm:hidden bg-white text-blue-700 font-bold px-6 py-3 rounded-full shadow-lg hover:bg-blue-50 transition-colors"
              >
                Assinar agora
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div id="assinar" className="max-w-2xl mx-auto px-4 py-8 sm:py-12 scroll-mt-4">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Adicione sua assinatura
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.name 
                        ? 'border-red-500 bg-red-50' 
                        : nameValidation.isValid === true 
                          ? 'border-green-500 bg-green-50' 
                          : nameValidation.isValid === false 
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-300'
                    }`}
                    placeholder="Digite seu nome e sobrenome"
                    autoComplete="name"
                  />
                  {/* Ícone de validação */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {nameValidation.isValid === true ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : nameValidation.isValid === false ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : null}
                  </div>
                </div>
                {/* Mensagem de validação em tempo real */}
                {nameValidation.message && (
                  <p className={`text-sm mt-1 transition-colors ${
                    nameValidation.isValid === true 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {nameValidation.message}
                  </p>
                )}
                {formErrors.name && !nameValidation.message && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Por favor, digite seu nome e sobrenome completos
                </p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Celular (WhatsApp) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.phone 
                        ? 'border-red-500 bg-red-50' 
                        : phoneValidation.isValid === true 
                          ? 'border-green-500 bg-green-50' 
                          : phoneValidation.isValid === false 
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                    }`}
                    placeholder="(47) 99999-9999"
                    maxLength={15}
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                  {/* Ícone de validação */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {phoneValidation.isChecking ? (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : phoneValidation.isValid === true ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : phoneValidation.isValid === false ? (
                      <X className="h-5 w-5 text-red-500" />
                    ) : formData.phone.length > 0 ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : null}
                  </div>
                </div>
                {/* Mensagem de validação em tempo real */}
                {phoneValidation.message && (
                  phoneValidation.isValid === false && phoneValidation.message.includes('já assinou') ? (
                    // Alerta destacado para número duplicado
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-800 font-semibold text-sm">
                            Número já cadastrado!
                          </p>
                          <p className="text-red-600 text-sm mt-1">
                            Este telefone já foi utilizado para assinar este abaixo-assinado. 
                            Cada pessoa pode assinar apenas uma vez.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm mt-1 transition-colors ${
                      phoneValidation.isValid === true 
                        ? 'text-green-600' 
                        : phoneValidation.isValid === false 
                          ? 'text-red-600 font-medium'
                          : 'text-gray-500'
                    }`}>
                      {phoneValidation.message}
                    </p>
                  )
                )}
                {formErrors.phone && !phoneValidation.message && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formato: (DDD) 9XXXX-XXXX - Apenas celulares com WhatsApp
                </p>
              </div>

              {/* Data de Nascimento */}
              <div className="md:col-span-2">
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  min="1900-01-01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.birthDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors.birthDate && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.birthDate}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Sua data de nascimento é necessária para validar sua identidade
                </p>
              </div>

              {/* CEP primeiro para busca automática */}
              <div className="md:col-span-2">
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                  CEP (Opcional)
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleCEPChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="00000-000"
                  maxLength={9}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite o CEP para preenchimento automático do endereço
                </p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço (Opcional)
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro (Opcional)
                </label>
                <input
                  type="text"
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bairro"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade (Opcional)
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado (Opcional)
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Termo de Consentimento LGPD */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentAccepted}
                  onChange={(e) => {
                    setConsentAccepted(e.target.checked);
                    // Limpar erro do consentimento se foi aceito
                    if (e.target.checked && formErrors.consent) {
                      setFormErrors(prev => ({ ...prev, consent: '' }));
                    }
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  Ao assinar este abaixo-assinado, você autoriza o tratamento dos seus dados pessoais informados neste formulário, de forma exclusiva, para fins de comunicação relacionados à <strong>"{petition?.name}"</strong>, incluindo atualizações, convites, avisos e informações desta campanha comunitária.
                </label>
              </div>
              {formErrors.consent && (
                <p className="text-red-600 text-sm mt-2 ml-7">{formErrors.consent}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Se o problema persistir, verifique sua conexão com a internet ou entre em contato com o responsável.
                    </p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={submitting || !consentAccepted}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Salvando...' : 'Assinar Abaixo-Assinado'}
              </button>
              {!consentAccepted && (
                <p className="text-gray-500 text-xs mt-2">
                  É necessário aceitar o termo de consentimento para assinar
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center space-y-4">
            {petition?.responsible && (
              <p className="text-gray-400 text-sm sm:text-base">
                <span className="text-gray-500">Responsável:</span> {petition.responsible}
              </p>
            )}
            
            {/* Botões de compartilhamento no footer */}
            {petition && (
              <div className="pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-4">Ajude a divulgar esta causa:</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      const text = `Assine o abaixo-assinado: ${petition.name}. Já são ${signatures.length} assinaturas!`;
                      const url = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${window.location.href}`)}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors"
                    title="Compartilhar no WhatsApp"
                  >
                    <MessageCircle size={20} />
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                      window.open(url, '_blank', 'width=600,height=400');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors"
                    title="Compartilhar no Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        alert('Link copiado!');
                      } catch (err) {
                        console.error('Erro ao copiar:', err);
                      }
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full transition-colors"
                    title="Copiar link"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-gray-500 text-xs pt-4">
              Sistema de Abaixo-Assinados © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
