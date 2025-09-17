import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, TrendingUp, Plus } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { getPetitions, getSignatureCount } from '../utils/supabase-storage';
import { Petition } from '../types';

export const Dashboard: React.FC = () => {
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [totalSignatures, setTotalSignatures] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allPetitions = await getPetitions();
        setPetitions(allPetitions);
        
        // Contar assinaturas de todas as petitions
        let total = 0;
        for (const petition of allPetitions) {
          const count = await getSignatureCount(petition.tableName);
          total += count;
        }
        setTotalSignatures(total);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const recentPetitions = petitions.length;
  const avgSignaturesPerPetition = petitions.length > 0 
    ? Math.round(totalSignatures / petitions.length) 
    : 0;

  const latestPetitions = petitions
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral dos abaixo-assinados coletados fisicamente</p>
          </div>
          <Link
            to="/petitions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Cadastrar Abaixo-Assinado
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total de Abaixo-Assinados"
          value={petitions.length}
          icon={FileText}
          color="blue"
          description="Coletados fisicamente"
        />
        <StatsCard
          title="Total de Assinaturas"
          value={totalSignatures}
          icon={Users}
          color="green"
          description="Digitalizadas no sistema"
        />
        <StatsCard
          title="Abaixo-Assinados Recentes"
          value={recentPetitions}
          icon={TrendingUp}
          color="orange"
          description="Cadastrados este mês"
        />
        <StatsCard
          title="Média por Abaixo-Assinado"
          value={avgSignaturesPerPetition}
          icon={Users}
          color="purple"
          description="Assinaturas por documento"
        />
      </div>

      {/* Recent Petitions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Abaixo-Assinados Recentes</h2>
            <Link 
              to="/petitions"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos
            </Link>
          </div>
        </div>
        
        {latestPetitions.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum abaixo-assinado criado</h3>
            <p className="text-gray-600 mb-4">Comece cadastrando seu primeiro abaixo-assinado coletado</p>
            <Link
              to="/petitions/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Cadastrar Abaixo-Assinado
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {latestPetitions.map((petition) => (
              <div key={petition.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/petitions/${petition.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {petition.name}
                      </Link>
                      {petition.location && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {petition.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Tabela: {petition.tableName}</span>
                      <span>•</span>
                      <span>Cadastrado em {petition.createdAt.toLocaleDateString('pt-BR')}</span>
                      {petition.collectionDate && (
                        <>
                          <span>•</span>
                          <span>Coletado em {petition.collectionDate.toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/petitions/${petition.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};