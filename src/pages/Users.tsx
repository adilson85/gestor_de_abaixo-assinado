import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppPermissionMap, AppRole, AppUser, GeneratedCredential } from '../types';
import { getAppUsers } from '../utils/app-users';
import {
  APP_ROLE_LABELS,
  buildDefaultOperatorPermissionMap,
  buildPermissionMap,
  getPermissionSummary,
} from '../utils/access';
import { deactivateAppUser, resetAppUserPassword, upsertAppUser } from '../utils/user-management';
import { PermissionMatrix } from '../components/PermissionMatrix';

type EditableUserState = {
  target: AppUser;
  fullName: string;
  role: AppRole;
  permissions: AppPermissionMap;
};

const getRoleTone = (role: AppRole) =>
  role === 'admin'
    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200';

export const Users: React.FC = () => {
  const { session, appUser, can } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [generatedCredential, setGeneratedCredential] = useState<GeneratedCredential | null>(null);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('operator');
  const [newUserPermissions, setNewUserPermissions] = useState<AppPermissionMap>(buildDefaultOperatorPermissionMap());

  const [editingUser, setEditingUser] = useState<EditableUserState | null>(null);
  const [savingEditUser, setSavingEditUser] = useState(false);

  const canCreateUsers = can('users.create', 'any');
  const canEditProfiles = can('users.edit_profile', 'any');
  const canEditPermissions = can('users.edit_permissions', 'any');
  const canResetPasswords = can('users.reset_password', 'any');
  const canDeactivateUsers = can('users.deactivate', 'any');

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const loadedUsers = await getAppUsers({ includeInactive: true, includePermissions: true });
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários internos:', error);
      alert('Não foi possível carregar os usuários do painel.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const activeUsers = useMemo(() => users.filter((user) => user.isActive), [users]);
  const inactiveUsers = useMemo(() => users.filter((user) => !user.isActive), [users]);
  const adminCount = useMemo(() => activeUsers.filter((user) => user.role === 'admin').length, [activeUsers]);
  const operatorCount = useMemo(
    () => activeUsers.filter((user) => user.role === 'operator').length,
    [activeUsers]
  );

  const resetCreateForm = () => {
    setNewUserEmail('');
    setNewUserFullName('');
    setNewUserRole('operator');
    setNewUserPermissions(buildDefaultOperatorPermissionMap());
  };

  const handleCreateUser = async () => {
    const email = newUserEmail.trim().toLowerCase();
    const fullName = newUserFullName.trim();

    if (!session) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!email) {
      alert('Por favor, informe o email do usuário.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor, informe um email válido.');
      return;
    }

    setSubmittingUser(true);
    setGeneratedCredential(null);

    try {
      const response = await upsertAppUser(session, {
        email,
        fullName: fullName || undefined,
        role: newUserRole,
        permissions: newUserRole === 'admin' ? undefined : newUserPermissions,
      });

      if (response.tempPassword) {
        setGeneratedCredential({
          email,
          password: response.tempPassword,
          title: 'Senha temporaria gerada',
          description: 'Compartilhe esta senha com seguranca. Depois do login, a pessoa podera definir a propria senha em Minha conta.',
        });
      }

      await loadUsers();
      resetCreateForm();
      alert(response.message || 'Usuario salvo com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar o usuário.');
    } finally {
      setSubmittingUser(false);
    }
  };

  const openEditUser = (targetUser: AppUser) => {
    setGeneratedCredential(null);
    setEditingUser({
      target: targetUser,
      fullName: targetUser.fullName || '',
      role: targetUser.role,
      permissions: buildPermissionMap(targetUser.permissions),
    });
  };

  const closeEditUser = () => {
    setEditingUser(null);
    setSavingEditUser(false);
  };

  const handleSaveUserDetails = async () => {
    if (!session || !editingUser) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    setSavingEditUser(true);

    try {
      const response = await upsertAppUser(session, {
        userId: editingUser.target.userId,
        email: editingUser.target.email,
        fullName: editingUser.fullName.trim() || undefined,
        role: editingUser.role,
        permissions: editingUser.role === 'admin' ? undefined : editingUser.permissions,
      });

      await loadUsers();
      closeEditUser();
      alert(response.message || 'Equipe atualizada com sucesso.');
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      alert(error instanceof Error ? error.message : 'Erro ao editar o usuário.');
      setSavingEditUser(false);
    }
  };

  const handleToggleActiveState = async (targetUser: AppUser) => {
    if (!session) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    if (targetUser.userId === appUser?.userId) {
      alert('Você não pode alterar o próprio status por esta tela.');
      return;
    }

    const confirmationMessage = targetUser.isActive
      ? `Tem certeza que deseja desativar o acesso de "${targetUser.email}"?`
      : `Reativar o acesso de "${targetUser.email}" com as permissões atuais?`;

    if (!confirm(confirmationMessage)) {
      return;
    }

    setBusyUserId(targetUser.userId);

    try {
      if (targetUser.isActive) {
        await deactivateAppUser(session, { userId: targetUser.userId });
        alert('Usuario desativado com sucesso.');
      } else {
        const response = await upsertAppUser(session, {
          userId: targetUser.userId,
          email: targetUser.email,
          fullName: targetUser.fullName,
          role: targetUser.role,
          permissions: targetUser.role === 'admin' ? undefined : buildPermissionMap(targetUser.permissions),
        });
        alert(response.message || 'Usuario reativado com sucesso.');
      }

      await loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      alert(error instanceof Error ? error.message : 'Erro ao alterar o status do usuário.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResetPassword = async (targetUser: AppUser) => {
    if (!session) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    if (targetUser.userId === appUser?.userId) {
      alert('Use a area Minha conta para trocar a sua propria senha.');
      return;
    }

    if (!confirm(`Gerar uma nova senha temporaria para "${targetUser.email}"?`)) {
      return;
    }

    setBusyUserId(targetUser.userId);
    setGeneratedCredential(null);

    try {
      const response = await resetAppUserPassword(session, { userId: targetUser.userId });

      if (response.tempPassword) {
        setGeneratedCredential({
          email: targetUser.email,
          password: response.tempPassword,
          title: 'Nova senha temporaria gerada',
          description: 'Envie esta senha a pessoa. Depois do login, ela podera definir a propria senha em Minha conta.',
        });
      }

      alert(response.message || 'Senha temporaria gerada com sucesso.');
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      alert(error instanceof Error ? error.message : 'Erro ao gerar a senha temporaria.');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white dark:shadow-xl dark:shadow-slate-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
              Usuários do painel
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Equipe, acessos e permissões
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Centralize aqui quem pode entrar no painel, o que cada pessoa pode fazer e qual o escopo operacional de cada acesso.
            </p>
          </div>
        </div>
      </section>

      {generatedCredential ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 dark:bg-slate-900 dark:text-amber-300">
              <KeyRound size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-950 dark:text-white">{generatedCredential.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {generatedCredential.description}
              </p>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm dark:border-amber-500/20 dark:bg-slate-950/40">
                <p className="font-medium text-slate-950 dark:text-white">{generatedCredential.email}</p>
                <p className="mt-1 font-mono text-slate-700 dark:text-slate-200">{generatedCredential.password}</p>
              </div>
            </div>
            <button
              onClick={() => setGeneratedCredential(null)}
              className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Acessos ativos', value: activeUsers.length, icon: <UsersIcon size={18} className="text-blue-600" /> },
          { label: 'Acessos inativos', value: inactiveUsers.length, icon: <UserCheck size={18} className="text-amber-600" /> },
          { label: 'Administradores', value: adminCount, icon: <ShieldCheck size={18} className="text-blue-600" /> },
          { label: 'Operadores', value: operatorCount, icon: <UserCog size={18} className="text-emerald-600" /> },
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Novo acesso interno</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Convide uma pessoa para o painel e ja defina o alcance do acesso dela.
              </p>
            </div>
          </div>

          {!canCreateUsers ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Seu usuário pode ver a equipe, mas não possui permissão para criar novos acessos.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <div className="relative mt-1">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(event) => setNewUserEmail(event.target.value)}
                      placeholder="email@organizacao.com"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome completo</label>
                  <input
                    type="text"
                    value={newUserFullName}
                    onChange={(event) => setNewUserFullName(event.target.value)}
                    placeholder="Nome da pessoa"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Papel-base</label>
                <select
                  value={newUserRole}
                  onChange={(event) => {
                    const nextRole = event.target.value as AppRole;
                    setNewUserRole(nextRole);
                    if (nextRole === 'operator') {
                      setNewUserPermissions(buildDefaultOperatorPermissionMap());
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="operator">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {canEditPermissions ? (
                <PermissionMatrix
                  role={newUserRole}
                  value={newUserPermissions}
                  onChange={(permissionCode, nextScope) =>
                    setNewUserPermissions((current) => ({
                      ...current,
                      [permissionCode]: nextScope,
                    }))
                  }
                />
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  onClick={resetCreateForm}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Limpar
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={submittingUser}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  {submittingUser ? 'Salvando...' : 'Criar acesso'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
              <UsersIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Equipe do painel</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Veja papel, status e o nivel de abertura de cada acesso.
              </p>
            </div>
          </div>

          {loadingUsers ? (
            <div className="mt-8 flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {users.map((user) => {
                const isCurrentUser = user.userId === appUser?.userId;
                const isBusy = busyUserId === user.userId;
                const permissionSummary = getPermissionSummary(user.permissions, user.role);

                return (
                  <article
                    key={user.userId}
                    className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                          {(user.fullName || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-slate-950 dark:text-white">
                              {user.fullName || 'Usuário sem nome'}
                            </p>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleTone(
                                user.role
                              )}`}
                            >
                              {APP_ROLE_LABELS[user.role]}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                user.isActive
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                                  : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                            {isCurrentUser ? (
                              <span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-slate-900 dark:text-blue-200">
                                Você
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {permissionSummary.summaryLabel}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Criado em {user.createdAt.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button
                          onClick={() => openEditUser(user)}
                          disabled={!canEditProfiles || isBusy}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          onClick={() => handleResetPassword(user)}
                          disabled={!canResetPasswords || isBusy || isCurrentUser || !user.isActive}
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/40 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-950/20"
                        >
                          <KeyRound size={16} />
                          Senha temporaria
                        </button>

                        <button
                          onClick={() => handleToggleActiveState(user)}
                          disabled={!canDeactivateUsers || isBusy || isCurrentUser}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.isActive
                              ? 'border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/20'
                              : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/20'
                          }`}
                        >
                          {user.isActive ? <Trash2 size={16} /> : <UserCheck size={16} />}
                          {isBusy ? 'Processando...' : user.isActive ? 'Desativar' : 'Reativar'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeEditUser} />
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                  Usuários
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  Editar acesso interno
                </h2>
              </div>
              <button
                onClick={closeEditUser}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input
                      type="email"
                      value={editingUser.target.email}
                      disabled
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome completo</label>
                    <input
                      type="text"
                      value={editingUser.fullName}
                      onChange={(event) =>
                        setEditingUser((current) =>
                          current
                            ? {
                                ...current,
                                fullName: event.target.value,
                              }
                            : current
                        )
                      }
                      placeholder="Nome da pessoa"
                      disabled={!canEditProfiles}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Papel-base</label>
                    <select
                      value={editingUser.role}
                      onChange={(event) => {
                        const nextRole = event.target.value as AppRole;
                        setEditingUser((current) =>
                          current
                            ? {
                                ...current,
                                role: nextRole,
                                permissions:
                                  nextRole === 'operator'
                                    ? current.target.role === 'admin'
                                      ? buildDefaultOperatorPermissionMap()
                                      : buildPermissionMap(current.permissions)
                                    : current.permissions,
                              }
                            : current
                        );
                      }}
                      disabled={!canEditProfiles || editingUser.target.userId === appUser?.userId}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="operator">Operador</option>
                      <option value="admin">Administrador</option>
                    </select>
                    {editingUser.target.userId === appUser?.userId ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        O próprio usuário não pode rebaixar o próprio papel por esta tela.
                      </p>
                    ) : null}
                  </div>
                </div>

                {canEditPermissions ? (
                  <PermissionMatrix
                    role={editingUser.role}
                    value={editingUser.permissions}
                    disabled={!canEditPermissions}
                    onChange={(permissionCode, nextScope) =>
                      setEditingUser((current) =>
                        current
                          ? {
                              ...current,
                              permissions: {
                                ...current.permissions,
                                [permissionCode]: nextScope,
                              },
                            }
                          : current
                      )
                    }
                  />
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5 dark:border-slate-800">
              <button
                onClick={closeEditUser}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUserDetails}
                disabled={savingEditUser}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil size={16} />
                {savingEditUser ? 'Salvando...' : 'Salvar alteracoes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
