import React from 'react';
import { BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';

interface ReportsChartProps {
  signatures: Array<{
    city?: string;
    state?: string;
    createdAt: Date;
  }>;
  className?: string;
}

export const ReportsChart: React.FC<ReportsChartProps> = ({ signatures, className = '' }) => {
  // Estatísticas por cidade
  const cityStats = signatures.reduce((acc, signature) => {
    if (signature.city) {
      acc[signature.city] = (acc[signature.city] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCities = Object.entries(cityStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Estatísticas por estado
  const stateStats = signatures.reduce((acc, signature) => {
    if (signature.state) {
      acc[signature.state] = (acc[signature.state] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topStates = Object.entries(stateStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Assinaturas por mês
  const monthlyStats = signatures.reduce((acc, signature) => {
    const month = signature.createdAt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.entries(monthlyStats)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-6); // Últimos 6 meses

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Cidades */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top 5 Cidades</h3>
        </div>
        
        {topCities.length > 0 ? (
          <div className="space-y-3">
            {topCities.map(([city, count]) => (
              <div key={city} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{city}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / Math.max(...topCities.map(([, c]) => c))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma assinatura com cidade informada</p>
        )}
      </div>

      {/* Top Estados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} className="text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top 5 Estados</h3>
        </div>
        
        {topStates.length > 0 ? (
          <div className="space-y-3">
            {topStates.map(([state, count]) => (
              <div key={state} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{state}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / Math.max(...topStates.map(([, c]) => c))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma assinatura com estado informado</p>
        )}
      </div>

      {/* Assinaturas por Mês */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assinaturas por Mês</h3>
        </div>
        
        {monthlyData.length > 0 ? (
          <div className="space-y-3">
            {monthlyData.map(([month, count]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / Math.max(...monthlyData.map(([, c]) => c))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma assinatura cadastrada</p>
        )}
      </div>

      {/* Estatísticas Gerais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-orange-600 dark:text-orange-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Estatísticas Gerais</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{signatures.length}</div>
            <div className="text-sm text-blue-800 dark:text-blue-300">Total de Assinaturas</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{Object.keys(cityStats).length}</div>
            <div className="text-sm text-green-800 dark:text-green-300">Cidades Diferentes</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(stateStats).length}</div>
            <div className="text-sm text-purple-800 dark:text-purple-300">Estados Diferentes</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {signatures.length > 0 ? Math.round(signatures.length / Object.keys(monthlyStats).length) : 0}
            </div>
            <div className="text-sm text-orange-800 dark:text-orange-300">Média por Mês</div>
          </div>
        </div>
      </div>
    </div>
  );
};
