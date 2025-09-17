import React from 'react';
import { Settings as SettingsIcon, Database, Download, Upload } from 'lucide-react';

export const Settings: React.FC = () => {
  const handleExportData = () => {
    const petitions = localStorage.getItem('petitions') || '[]';
    const signatures = localStorage.getItem('signatures') || '[]';
    
    const exportData = {
      petitions: JSON.parse(petitions),
      signatures: JSON.parse(signatures),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup-gestao-peticoes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          if (data.petitions && data.signatures) {
            localStorage.setItem('petitions', JSON.stringify(data.petitions));
            localStorage.setItem('signatures', JSON.stringify(data.signatures));
            alert('Dados importados com sucesso! Recarregue a página para ver as mudanças.');
          } else {
            alert('Formato de arquivo inválido.');
          }
        } catch (error) {
          alert('Erro ao importar dados. Verifique o formato do arquivo.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('petitions');
      localStorage.removeItem('signatures');
      alert('Dados apagados com sucesso! Recarregue a página.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database size={24} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Gerenciar Dados</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Backup dos Dados</h3>
              <p className="text-sm text-gray-600 mb-4">
                Faça o download de todos os dados (abaixo-assinados e assinaturas) em formato JSON.
              </p>
              <button
                onClick={handleExportData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Exportar Dados
              </button>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Importar Dados</h3>
              <p className="text-sm text-gray-600 mb-4">
                Importe dados de um backup anterior. Isso substituirá todos os dados atuais.
              </p>
              <button
                onClick={handleImportData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                Importar Dados
              </button>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Limpar Dados</h3>
              <p className="text-sm text-gray-600 mb-4">
                Remove todos os dados do sistema. Esta ação não pode ser desfeita.
              </p>
              <button
                onClick={handleClearData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Apagar Todos os Dados
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon size={24} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sobre o Sistema</h2>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Nome:</strong> Gestão de Abaixo-Assinados</p>
            <p><strong>Versão:</strong> 1.0.0</p>
            <p><strong>Desenvolvido para:</strong> Digitalização de abaixo-assinados físicos</p>
            <p><strong>Armazenamento:</strong> Local (LocalStorage)</p>
          </div>
        </div>
      </div>
    </div>
  );
};