import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { validateName, generateSlug } from '../utils/validation';
import { savePetition, getPetitions } from '../utils/supabase-storage';
import { Petition } from '../types';

export const CreatePetition: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [responsible, setResponsible] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const newErrors: { [key: string]: string } = {};
    
    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;
    
    // Check for slug uniqueness
    const slug = generateSlug(name);
    const existingPetitions = await getPetitions();
    if (existingPetitions.some(p => p.slug === slug)) {
      newErrors.name = 'Já existe um abaixo-assinado com este nome';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

  let imageUrl: string | undefined = undefined;

    const petitionData = {
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      collectionDate: collectionDate ? new Date(collectionDate) : undefined,
      responsible: responsible.trim() || undefined,
      imageUrl,
    };

    try {
      const savedPetition = await savePetition(petitionData);
      if (savedPetition) {
        navigate('/petitions');
      } else {
        setErrors({ general: 'Erro ao criar abaixo-assinado. Tente novamente.' });
      }
    } catch (error) {
      console.error('Error creating petition:', error);
      setErrors({ general: 'Erro ao criar abaixo-assinado. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Removido upload de imagem por solicitação

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/petitions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
          Voltar para lista
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Abaixo-Assinado</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-300">Cadastre um abaixo-assinado coletado fisicamente</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700">
                <p className="text-red-600 text-sm dark:text-red-300">{errors.general}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                Nome do Abaixo-Assinado *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300 ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Digite o nome do abaixo-assinado"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1 dark:text-red-300">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                Descrição (Opcional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300 dark:border-gray-600"
                placeholder="Digite uma descrição para o abaixo-assinado"
              />
            </div>

            {/* Upload de imagem removido */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Local da Coleta
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300 dark:border-gray-600"
                  placeholder="Ex: Praça Central, Escola Municipal..."
                />
              </div>
              
              <div>
                <label htmlFor="collectionDate" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Data da Coleta
                </label>
                <input
                  type="date"
                  id="collectionDate"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                Responsável pela Coleta
              </label>
              <input
                type="text"
                id="responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300 dark:border-gray-600"
                placeholder="Nome do responsável pela coleta"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/petitions')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {isLoading ? 'Salvando...' : 'Cadastrar Abaixo-Assinado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};