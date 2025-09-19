import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, ExternalLink, Calendar, Users } from 'lucide-react';
import { SearchFilter } from '../components/SearchFilter';
import { Pagination } from '../components/Pagination';
import { getPetitions, getSignatureCount } from '../utils/supabase-storage';
import { Petition } from '../types';

export const PetitionList: React.FC = () => {
  const navigate = useNavigate();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [signatureCounts, setSignatureCounts] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const allPetitions = await getPetitions();
        setPetitions(allPetitions);
        
        // Carregar contagem de assinaturas para cada petition
        const counts: { [key: string]: number } = {};
        for (const petition of allPetitions) {
          try {
            counts[petition.id] = await getSignatureCount(petition.id);
          } catch (countError) {
            console.error(`Error loading signature count for petition ${petition.id}:`, countError);
            counts[petition.id] = 0;
          }
        }
        setSignatureCounts(counts);
      } catch (error) {
        console.error('Error loading petitions:', error);
        setError('Erro ao carregar abaixo-assinados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const uniqueLocations = Array.from(new Set(petitions.map(p => p.location).filter(Boolean))).sort();

  const filters = (
    <div className="flex gap-2">
      <select
        value={locationFilter}
        onChange={(e) => setLocationFilter(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
      >
        <option value="">Todos os locais</option>
        {uniqueLocations.map(location => (
          <option key={location} value={location}>{location}</option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  const filteredPetitions = petitions.filter(petition => {
    const matchesSearch = petition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (petition.description && petition.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (petition.responsible && petition.responsible.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = !locationFilter || 
      (petition.location && petition.location.toLowerCase().includes(locationFilter.toLowerCase()));
    
    return matchesSearch && matchesLocation;
  });

  const totalPages = Math.ceil(filteredPetitions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPetitions = filteredPetitions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="dark:text-gray-100">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Abaixo-Assinados</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-300">Gerencie todos os abaixo-assinados coletados fisicamente</p>
          </div>
          <Link
            to="/petitions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Cadastrar Novo
          </Link>
        </div>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        placeholder="Buscar por nome, descrição ou responsável..."
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        {paginatedPetitions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              {filteredPetitions.length === 0 && searchTerm ? (
                <div>
                  <Eye size={48} className="mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum resultado encontrado</h3>
                  <p className="text-gray-600">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                <div>
                  <Plus size={48} className="mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum abaixo-assinado cadastrado</h3>
                  <p className="text-gray-600 mb-4">Comece cadastrando seu primeiro abaixo-assinado coletado</p>
                  <Link
                    to="/petitions/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Cadastrar Abaixo-Assinado
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Local da Coleta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data da Coleta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assinaturas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {paginatedPetitions.map((petition) => (
                    <tr 
                      key={petition.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate(`/petitions/${petition.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {petition.name}
                            </div>
                            {petition.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {petition.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {petition.location || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {petition.collectionDate ? petition.collectionDate.toLocaleDateString('pt-BR') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Users size={16} className="mr-1" />
                          {signatureCounts[petition.id] || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-300">
                            Ativo
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div 
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`/petitions/${petition.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </Link>
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
              totalItems={filteredPetitions.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};