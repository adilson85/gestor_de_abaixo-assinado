import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Download, Upload, AlertTriangle, Clock, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getGlobalKanbanBoard, getKanbanColumns, getColumnDeadlines, saveColumnDeadline } from '../utils/kanban-storage';
import { KanbanColumn, KanbanColumnDeadline } from '../types';

export const Settings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [deadlines, setDeadlines] = useState<Map<string, KanbanColumnDeadline>>(new Map());
  const [editingDeadlines, setEditingDeadlines] = useState<Map<string, { value: number; unit: 'days' | 'months' | 'years' }>>(new Map());
  const [savingDeadline, setSavingDeadline] = useState<string | null>(null);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);

  // Carregar colunas e prazos
  useEffect(() => {
    loadDeadlinesConfig();
  }, []);

  const loadDeadlinesConfig = async () => {
    try {
      setLoadingDeadlines(true);
      const board = await getGlobalKanbanBoard();
      if (!board) {
        console.error('Board global não encontrado');
        return;
      }

      const [columnsData, deadlinesData] = await Promise.all([
        getKanbanColumns(board.id),
        getColumnDeadlines(board.id)
      ]);

      setColumns(columnsData);

      // Criar mapa de deadlines por columnId
      const deadlinesMap = new Map<string, KanbanColumnDeadline>();
      deadlinesData.forEach(deadline => {
        deadlinesMap.set(deadline.columnId, deadline);
      });
      setDeadlines(deadlinesMap);

      // Inicializar valores de edição
      const editingMap = new Map<string, { value: number; unit: 'days' | 'months' | 'years' }>();
      columnsData.forEach(column => {
        const deadline = deadlinesMap.get(column.id);
        editingMap.set(column.id, {
          value: deadline?.durationValue || 30,
          unit: deadline?.durationUnit || 'days'
        });
      });
      setEditingDeadlines(editingMap);
    } catch (error) {
      console.error('Erro ao carregar configurações de prazos:', error);
    } finally {
      setLoadingDeadlines(false);
    }
  };

  const handleDeadlineChange = (columnId: string, field: 'value' | 'unit', newValue: number | 'days' | 'months' | 'years') => {
    const editing = new Map(editingDeadlines);
    const current = editing.get(columnId) || { value: 30, unit: 'days' as const };
    editing.set(columnId, {
      ...current,
      [field]: newValue
    });
    setEditingDeadlines(editing);
  };

  const handleSaveDeadline = async (columnId: string) => {
    const editing = editingDeadlines.get(columnId);
    if (!editing) return;

    setSavingDeadline(columnId);
    try {
      const saved = await saveColumnDeadline(columnId, editing.value, editing.unit);
      if (saved) {
        const newDeadlines = new Map(deadlines);
        newDeadlines.set(columnId, saved);
        setDeadlines(newDeadlines);
        alert('Prazo salvo com sucesso!');
      } else {
        alert('Erro ao salvar prazo. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao salvar prazo:', error);
      alert('Erro ao salvar prazo. Tente novamente.');
    } finally {
      setSavingDeadline(null);
    }
  };

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
            <Clock size={24} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Prazos das Tarefas Kanban</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
            Configure o prazo de vencimento automático para cada etapa do Kanban. Quando uma tarefa é movida para uma coluna, o prazo será calculado automaticamente com base na configuração abaixo.
          </p>

          {loadingDeadlines ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {columns.map((column) => {
                const deadline = deadlines.get(column.id);
                const editing = editingDeadlines.get(column.id) || { value: 30, unit: 'days' as const };
                const isSaving = savingDeadline === column.id;
                const hasChanged = !deadline || 
                  deadline.durationValue !== editing.value || 
                  deadline.durationUnit !== editing.unit;

                return (
                  <div
                    key={column.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {column.name}
                      </h3>
                      {deadline && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Prazo atual: {deadline.durationValue} {deadline.durationUnit === 'days' ? 'dias' : deadline.durationUnit === 'months' ? 'meses' : 'anos'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Duração
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editing.value}
                          onChange={(e) => handleDeadlineChange(column.id, 'value', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Unidade
                        </label>
                        <select
                          value={editing.unit}
                          onChange={(e) => handleDeadlineChange(column.id, 'unit', e.target.value as 'days' | 'months' | 'years')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="days">Dias</option>
                          <option value="months">Meses</option>
                          <option value="years">Anos</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => handleSaveDeadline(column.id)}
                          disabled={isSaving || !hasChanged}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Salvar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {columns.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhuma coluna encontrada. Crie colunas no Kanban primeiro.
                </p>
              )}
            </div>
          )}
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