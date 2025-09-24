import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, MapPin, CheckCircle } from 'lucide-react';
import { Petition, Signature } from '../types';
import { getPetitionBySlug, saveSignature, getSignaturesByPetition, checkPhoneDuplicate } from '../utils/supabase-storage';
import { validatePhone } from '../utils/validation';

export const PublicPetition: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [petition, setPetition] = useState<Petition | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [consentAccepted, setConsentAccepted] = useState(false);

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
      
      // Carregar assinaturas para mostrar contador
      const signaturesData = await getSignaturesByPetition(petitionData.id);
      setSignatures(signaturesData);
    } catch (err) {
      console.error('Error loading petition:', err);
      setError('Erro ao carregar abaixo-assinado');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
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
    } else {
      const nameParts = formData.name.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length < 2) {
        errors.name = 'Digite seu nome completo (nome e sobrenome)';
      }
    }

    // Validar telefone celular
    if (!formData.phone.trim()) {
      errors.phone = 'Telefone celular é obrigatório';
    } else {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) {
        errors.phone = phoneError;
      } else {
        // Verificar se é celular (deve ter 9 dígitos após DDD)
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length === 11) {
          const ninthDigit = cleanPhone[2]; // Terceiro dígito após DDD
          if (ninthDigit !== '9') {
            errors.phone = 'Digite um número de celular válido (deve começar com 9)';
          } else if (petition) {
            // Verificar telefone duplicado
            const isDuplicate = await checkPhoneDuplicate(petition.id, cleanPhone);
            if (isDuplicate) {
              errors.phone = 'Este número já foi cadastrado neste abaixo-assinado';
            }
          }
        } else {
          errors.phone = 'Digite um número de celular válido (11 dígitos)';
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
        
        // Iniciar contagem regressiva
        let timeLeft = 3;
        setCountdown(timeLeft);
        
        const countdownInterval = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);
          
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            window.location.href = 'https://tonezi.com.br/';
          }
        }, 1000);
      } else {
        setError('Erro ao salvar assinatura. Tente novamente.');
      }
    } catch (err) {
      console.error('Error saving signature:', err);
      setError('Erro ao salvar assinatura. Tente novamente.');
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-800 mb-2">
              Redirecionando para o site oficial...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span className="text-lg font-bold text-green-700">{countdown}</span>
              <span className="text-sm text-green-600">segundos</span>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Você será redirecionado para tonezi.com.br
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">ABAIXO-ASSINADO</h1>
            <h2 className="text-3xl font-bold mb-6">{petition?.name}</h2>
            
            {petition?.description && (
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                {petition.description}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-6 text-blue-100">
              {petition?.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={20} />
                  <span>{petition.location}</span>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
                <Users size={24} className="mr-3" />
                <div className="text-left">
                  <div className="text-2xl font-bold">{signatures.length}</div>
                  <div className="text-sm font-medium">Total de assinaturas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Adicione sua assinatura
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite seu nome e sobrenome"
                />
                {formErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Celular *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                />
                {formErrors.phone && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>
                )}
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
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-300">
            {petition?.responsible && `Responsável: ${petition.responsible}`}
          </p>
        </div>
      </div>
    </div>
  );
};
