import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  AlertTriangle,
  Clock,
  Save,
  Users,
  UserPlus,
  Trash2,
  Mail,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getGlobalKanbanBoard, getKanbanColumns, getColumnDeadlines, saveColumnDeadline } from '../utils/kanban-storage';
import { AdminUser, KanbanColumn, KanbanColumnDeadline } from '../types';

const formatDurationUnit = (unit: 'days' | 'months' | 'years') => {
  if (unit === 'days') return 'dias';
  if (unit === 'months') return 'meses';
  return 'anos';
};

export const Settings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [deadlines, setDeadlines] = useState<Map<string, KanbanColumnDeadline>>(new Map());
  const [editingDeadlines, setEditingDeadlines] = useState<Map<string, { value: number; unit: 'days' | 'months' | 'years' }>>(new Map());
  const [savingDeadline, setSavingDeadline] = useState<string | null>(null);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const [showDeadlinesModal, setShowDeadlinesModal] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);

  useEffect(() => {
    loadDeadlinesConfig();
    loadAdmins();
  }, []);

  const loadDeadlinesConfig = async () => {
    try {
      setLoadingDeadlines(true);
      const board = await getGlobalKanbanBoard();
      if (!board) {
        console.error('Quadro global não encontrado');
        return;
      }

      const [columnsData, deadlinesData] = await Promise.all([
        getKanbanColumns(board.id),
        getColumnDeadlines(board.id),
      ]);

      setColumns(columnsData);

      const deadlinesMap = new Map<string, KanbanColumnDeadline>();
      deadlinesData.forEach((deadline) => deadlinesMap.set(deadline.columnId, deadline));
      setDeadlines(deadlinesMap);

      const editingMap = new Map<string, { value: number; unit: 'days' | 'months' | 'years' }>();
      columnsData.forEach((column) => {
        const deadline = deadlinesMap.get(column.id);
        editingMap.set(column.id, {
          value: deadline?.durationValue || 30,
          unit: deadline?.durationUnit || 'days',
        });
      });
      setEditingDeadlines(editingMap);
    } catch (error) {
      console.error('Erro ao carregar configurações de prazos:', error);
    } finally {
      setLoadingDeadlines(false);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao carregar administradores:', error);
        return;
      }

      setAdmins(
        (data || []).map((admin) => ({
          id: admin.id,
          userId: admin.user_id,
          email: admin.email,
          createdAt: new Date(admin.created_at),
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) {
      alert('Por favor, informe o e-mail do administrador.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor, informe um e-mail válido.');
      return;
    }

    if (admins.some((admin) => admin.email.toLowerCase() === email)) {
      alert('Este e-mail já está cadastrado como administrador.');
      return;
    }

    setAddingAdmin(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert({ user_id: crypto.randomUUID(), email })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('Este e-mail já está cadastrado como administrador.');
        } else {
          console.error('Erro ao adicionar administrador:', error);
          alert('Erro ao adicionar administrador. Tente novamente.');
        }
        return;
      }

      setAdmins([
        {
          id: data.id,
          userId: data.user_id,
          email: data.email,
          createdAt: new Date(data.created_at),
        },
        ...admins,
      ]);
      setNewAdminEmail('');
      alert('Administrador adicionado com sucesso.');
    } catch (error) {
      console.error('Erro ao adicionar administrador:', error);
      alert('Erro ao adicionar administrador. Tente novamente.');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email?.toLowerCase() === adminEmail.toLowerCase()) {
      alert('Você não pode remover a si mesmo como administrador.');
      return;
    }

    if (!confirm(`Tem certeza que deseja remover "${adminEmail}" da lista de administradores?`)) {
      return;
    }

    setDeletingAdminId(adminId);
    try {
      const { error } = await supabase.from('admin_users').delete().eq('id', adminId);
      if (error) {
        console.error('Erro ao remover administrador:', error);
        alert('Erro ao remover administrador. Tente novamente.');
        return;
      }

      setAdmins(admins.filter((admin) => admin.id !== adminId));
      alert('Administrador removido com sucesso.');
    } catch (error) {
      console.error('Erro ao remover administrador:', error);
      alert('Erro ao remover administrador. Tente novamente.');
    } finally {
      setDeletingAdminId(null);
    }
  };

  const handleDeadlineChange = (columnId: string, field: 'value' | 'unit', newValue: number | 'days' | 'months' | 'years') => {
    const editing = new Map(editingDeadlines);
    const current = editing.get(columnId) || { value: 30, unit: 'days' as const };
    editing.set(columnId, { ...current, [field]: newValue });
    setEditingDeadlines(editing);
  };

  const handleSaveDeadline = async (columnId: string) => {
    const editing = editingDeadlines.get(columnId);
    if (!editing) return;

    setSavingDeadline(columnId);
    try {
      const saved = await saveColumnDeadline(columnId, editing.value, editing.unit);
      if (!saved) {
        alert('Erro ao salvar prazo. Tente novamente.');
        return;
      }

      const updatedDeadlines = new Map(deadlines);
      updatedDeadlines.set(columnId, saved);
      setDeadlines(updatedDeadlines);
      alert('Prazo salvo com sucesso.');
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
      const [petitionsResult, signaturesResult, kanbanResult] = await Promise.all([
        supabase.from('petitions').select('*'),
        supabase.from('signatures').select('*'),
        supabase.from('kanban_tasks').select('*'),
      ]);

      const exportData = {
        petitions: petitionsResult.data || [],
        signatures: signaturesResult.data || [],
        kanban_tasks: kanbanResult.data || [],
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup-assinapovo-${new Date().toISOString().split('T')[0]}.json`;
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
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        try {
          const data = JSON.parse(readerEvent.target?.result as string);
          if (!data.petitions || !data.signatures) {
            alert('Formato de arquivo inválido.');
            return;
          }

          await supabase.from('signatures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('petitions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (data.petitions.length > 0) await supabase.from('petitions').insert(data.petitions);
          if (data.signatures.length > 0) await supabase.from('signatures').insert(data.signatures);
          alert('Dados importados com sucesso. Recarregue a página para ver as mudanças.');
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
    if (!confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita e manterá apenas a estrutura do Kanban.')) {
      return;
    }

    setIsLoading(true);
    try {
      await supabase.from('signatures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kanban_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kanban_attachments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kanban_checklist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kanban_checklists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kanban_task_assignees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kanban_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('petitions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      alert('Dados apagados com sucesso. A estrutura do Kanban foi mantida.');
    } catch (error) {
      console.error('Erro ao apagar dados:', error);
      alert('Erro ao apagar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const configuredDeadlineCount = deadlines.size;
  const pendingDeadlineCount = Math.max(columns.length - configuredDeadlineCount, 0);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white dark:shadow-xl dark:shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
              Configurações do sistema
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Central de operação do AssinaPovo Admin</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Organize acessos, mantenha o Kanban configurado e execute rotinas críticas com mais clareza e menos risco operacional.
            </p>
          </div>
          <button
            onClick={() => setShowDeadlinesModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:border dark:border-white/10 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <Clock size={16} />
            Configurar prazos do Kanban
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Administradores ativos', value: admins.length, icon: <Users size={18} className="text-blue-600" /> },
          { label: 'Etapas com prazo', value: configuredDeadlineCount, icon: <Clock size={18} className="text-emerald-600" /> },
          { label: 'Etapas sem prazo', value: pendingDeadlineCount, icon: <AlertTriangle size={18} className="text-amber-600" /> },
          { label: 'Rotinas críticas', value: 3, icon: <Database size={18} className="text-violet-600" /> },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
              {item.icon}
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Equipe e acesso</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Cadastre os e-mails responsáveis pela operação do painel e mantenha o acesso centralizado.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Adicionar administrador</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
                  placeholder="email@organizacao.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <button
                onClick={handleAddAdmin}
                disabled={addingAdmin || !newAdminEmail.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={16} />
                {addingAdmin ? 'Adicionando...' : 'Adicionar acesso'}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Equipe cadastrada</p>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {admins.length} acesso{admins.length === 1 ? '' : 's'}
              </span>
            </div>
            {loadingAdmins ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : admins.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nenhum administrador cadastrado até o momento.
              </div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                        {admin.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-950 dark:text-white">{admin.email}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Adicionado em {admin.createdAt.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                      disabled={deletingAdminId === admin.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/20"
                    >
                      <Trash2 size={16} />
                      {deletingAdminId === admin.id ? 'Removendo...' : 'Remover'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Automação do Kanban</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Defina o prazo padrão de cada etapa para manter alertas e vencimentos coerentes com a operação.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {loadingDeadlines ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
                </div>
              ) : columns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Nenhuma etapa de Kanban encontrada.
                </div>
              ) : (
                columns.slice(0, 4).map((column) => {
                  const deadline = deadlines.get(column.id);
                  return (
                    <div key={column.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-950 dark:text-white">{column.name}</p>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {deadline ? `${deadline.durationValue} ${formatDurationUnit(deadline.durationUnit)}` : 'Sem prazo'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <SettingsIcon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Ambiente do painel</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Referência rápida do que está ativo no admin e das rotinas que exigem maior cuidado.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                Marca: AssinaPovo Admin
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                Estrutura: campanhas, assinaturas, Kanban e usuários administrativos
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                Infraestrutura: Supabase com persistência em PostgreSQL
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Backups e importação</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Exporte a base atual para backup e importe pacotes somente em janelas controladas.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button onClick={handleExportData} disabled={isLoading} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-blue-500/30">
              <Download size={18} className="text-blue-600 dark:text-blue-300" />
              <p className="mt-3 font-semibold text-slate-950 dark:text-white">{isLoading ? 'Exportando...' : 'Exportar dados'}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gera um arquivo JSON com campanhas, apoios e tarefas.</p>
            </button>
            <button onClick={handleImportData} disabled={isLoading} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-emerald-500/30">
              <Upload size={18} className="text-emerald-600 dark:text-emerald-300" />
              <p className="mt-3 font-semibold text-slate-950 dark:text-white">{isLoading ? 'Importando...' : 'Importar backup'}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Substitui a base atual pelos dados do arquivo selecionado.</p>
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Zona de risco operacional</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Use estas ações apenas com confirmação da equipe responsável. Elas impactam toda a operação do painel.
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-red-200 bg-white/80 p-4 dark:border-red-900/40 dark:bg-slate-950/30">
            <p className="font-semibold text-slate-950 dark:text-white">Limpeza total dos dados</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Remove campanhas, assinaturas e tarefas. A estrutura do Kanban é preservada, mas o conteúdo operacional é apagado.
            </p>
            <button
              onClick={handleClearData}
              disabled={isLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isLoading ? 'Apagando...' : 'Apagar todos os dados'}
            </button>
          </div>
        </section>
      </div>

      {showDeadlinesModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowDeadlinesModal(false)} />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">Prazos do Kanban</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Defina o vencimento automático por etapa</h2>
              </div>
              <button onClick={() => setShowDeadlinesModal(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              {loadingDeadlines ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              ) : columns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Nenhuma etapa encontrada para configurar.
                </div>
              ) : (
                <div className="space-y-4">
                  {columns.map((column) => {
                    const deadline = deadlines.get(column.id);
                    const editing = editingDeadlines.get(column.id) || { value: 30, unit: 'days' as const };
                    const isSaving = savingDeadline === column.id;
                    const hasChanged = !deadline || deadline.durationValue !== editing.value || deadline.durationUnit !== editing.unit;

                    return (
                      <div key={column.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-slate-950 dark:text-white">{column.name}</p>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {deadline ? `Atual: ${deadline.durationValue} ${formatDurationUnit(deadline.durationUnit)}` : 'Ainda sem prazo definido'}
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            type="number"
                            min="1"
                            value={editing.value}
                            onChange={(e) => handleDeadlineChange(column.id, 'value', parseInt(e.target.value, 10) || 1)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                          <select
                            value={editing.unit}
                            onChange={(e) => handleDeadlineChange(column.id, 'unit', e.target.value as 'days' | 'months' | 'years')}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="days">Dias</option>
                            <option value="months">Meses</option>
                            <option value="years">Anos</option>
                          </select>
                          <button
                            onClick={() => handleSaveDeadline(column.id)}
                            disabled={isSaving || !hasChanged}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Save size={16} />
                            {isSaving ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
