import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Download, Upload, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Settings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // Buscar dados do Supabase
      const [petitionsResult, signaturesResult, kanbanResult] = await Promise.all([
        supabase.from('petitions').select('*'),
        supabase.from('signatures').select('*'),
        supabase.from('kanban_tasks').select('*')
      ]);

      const exportData = {
        petitions: petitionsResult.data || [],
        signatures: signaturesResult.data || [],
        kanban_tasks: kanbanResult.data || [],
        exportedAt: new Date().toISOString(),
        version: '2.0.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup-gestao-peticoes-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          if (data.petitions && data.signatures) {
            // Limpar dados existentes
            await supabase.from('signatures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('petitions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            
            // Importar novos dados
            if (data.petitions.length > 0) {
              await supabase.from('petitions').insert(data.petitions);
            }
            if (data.signatures.length > 0) {
              await supabase.from('signatures').insert(data.signatures);
            }
            
            alert('Dados importados com sucesso! Recarregue a página para ver as mudanças.');
          } else {
            alert('Formato de arquivo inválido.');
          }
        } catch (error) {
          console.error('Erro ao importar dados:', error);
          alert('Erro ao importar dados. Verifique o formato do arquivo.');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleClearData = async () => {
    if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.\n\n⚠️ ATENÇÃO: Isso manterá a estrutura do Kanban intacta, mas apagará todas as tarefas e dados.')) {
      setIsLoading(true);
      try {
        // Limpar apenas dados, mantendo estrutura do Kanban
        await supabase.from('signatures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('kanban_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('kanban_attachments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('kanban_checklist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('kanban_checklists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('kanban_task_assignees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('kanban_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // NÃO apagar kanban_columns e kanban_boards - manter estrutura
        await supabase.from('petitions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        alert('Dados apagados com sucesso! A estrutura do Kanban foi mantida.');
      } catch (error) {
        console.error('Erro ao apagar dados:', error);
        alert('Erro ao apagar dados. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-300">Gerencie as configurações do sistema</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Database size={24} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciar Dados</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2 dark:text-white">Backup dos Dados</h3>
              <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
                Faça o download de todos os dados (abaixo-assinados e assinaturas) em formato JSON.
              </p>
              <button
                onClick={handleExportData}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                {isLoading ? 'Exportando...' : 'Exportar Dados'}
              </button>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div>
              <h3 className="font-medium text-gray-900 mb-2 dark:text-white">Importar Dados</h3>
              <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
                Importe dados de um backup anterior. Isso substituirá todos os dados atuais.
              </p>
              <button
                onClick={handleImportData}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                {isLoading ? 'Importando...' : 'Importar Dados'}
              </button>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div>
              <h3 className="font-medium text-gray-900 mb-2 dark:text-white">Limpar Dados</h3>
              <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
                Remove todos os dados do sistema (petições, assinaturas, tarefas). A estrutura do Kanban será mantida. Esta ação não pode ser desfeita.
              </p>
              <button
                onClick={handleClearData}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle size={16} />
                {isLoading ? 'Apagando...' : 'Apagar Todos os Dados'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon size={24} className="text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sobre o Sistema</h2>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p><strong>Nome:</strong> Gestão de Abaixo-Assinados</p>
            <p><strong>Versão:</strong> 2.0.0</p>
            <p><strong>Desenvolvido para:</strong> Digitalização de abaixo-assinados físicos</p>
            <p><strong>Armazenamento:</strong> Supabase (PostgreSQL)</p>
            <p><strong>Funcionalidades:</strong> Kanban, Comentários, Arquivamento</p>
          </div>
        </div>
      </div>
    </div>
  );
};