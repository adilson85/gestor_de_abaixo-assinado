import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, ShieldCheck, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { APP_ROLE_LABELS } from '../utils/access';

export const Account: React.FC = () => {
  const { appUser, user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const displayName = useMemo(() => appUser?.fullName || user?.email || 'Usuário', [appUser, user]);

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Preencha e confirme a nova senha.');
      return;
    }

    if (newPassword.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha precisa ser igual.');
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Senha atualizada com sucesso. Use esta nova senha nos próximos logins.');
    } catch (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      setError(updateError instanceof Error ? updateError.message : 'Erro ao atualizar senha.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white dark:shadow-xl dark:shadow-slate-950/20">
        <div>
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
            Minha conta
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Credenciais e acesso pessoal
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Use esta área para conferir seus dados de acesso e trocar a senha sempre que precisar.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <UserCog size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Identidade do painel</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Resumo do perfil interno autenticado agora.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Nome exibido</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{displayName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Email</p>
              <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{appUser?.email || user?.email}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Papel</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                <ShieldCheck size={14} />
                {appUser?.role ? APP_ROLE_LABELS[appUser.role] : 'Sem papel'}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Trocar senha</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Se você recebeu uma senha temporária do admin, defina aqui a senha que quer usar no dia a dia.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleChangePassword}>
            {error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-300" />
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            ) : null}

            {success ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-300" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <KeyRound size={16} />
              {submitting ? 'Salvando senha...' : 'Atualizar senha'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
