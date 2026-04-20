import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppPermissionMap, AppRole, PermissionScope } from '../types';
import {
  APP_PERMISSION_DEFINITIONS,
  AppPermissionDefinition,
  PERMISSION_SCOPE_LABELS,
  getPermissionBadgeTone,
} from '../utils/access';

interface PermissionMatrixProps {
  role: AppRole;
  value: AppPermissionMap;
  onChange: (permissionCode: keyof AppPermissionMap, nextScope: PermissionScope) => void;
  disabled?: boolean;
}

const MODULE_LABELS: Record<AppPermissionDefinition['module'], string> = {
  dashboard: 'Dashboard',
  petitions: 'Campanhas',
  signatures: 'Assinaturas',
  kanban: 'Kanban',
  users: 'Usuários',
  settings: 'Configurações',
};

const MODULE_DESCRIPTIONS: Record<AppPermissionDefinition['module'], string> = {
  dashboard: 'Indicadores gerais e visão executiva.',
  petitions: 'Cadastro, edição e publicação de abaixo-assinados.',
  signatures: 'Operação dos apoios coletados e follow-up.',
  kanban: 'Fluxo de execução, cards, comentários e anexos.',
  users: 'Equipe, acessos, senha temporária e ativação.',
  settings: 'Backups, auditoria e ações globais do sistema.',
};

const groupedPermissions = APP_PERMISSION_DEFINITIONS.reduce<
  Record<AppPermissionDefinition['module'], AppPermissionDefinition[]>
>((acc, permission) => {
  acc[permission.module] = [...(acc[permission.module] || []), permission];
  return acc;
}, {
  dashboard: [],
  petitions: [],
  signatures: [],
  kanban: [],
  users: [],
  settings: [],
});

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  role,
  value,
  onChange,
  disabled = false,
}) => {
  if (role === 'admin') {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-200">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-950 dark:text-white">Administrador com acesso total</p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Perfis de administrador ignoram a matriz abaixo e recebem acesso completo a todas as áreas e ações do painel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(Object.keys(groupedPermissions) as AppPermissionDefinition['module'][]).map((module) => (
        <section
          key={module}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">{MODULE_LABELS[module]}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{MODULE_DESCRIPTIONS[module]}</p>
          </div>

          <div className="space-y-3">
            {groupedPermissions[module].map((permission) => {
              const currentScope = value[permission.code];

              return (
                <div
                  key={permission.code}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-950 dark:text-white">{permission.label}</p>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPermissionBadgeTone(
                            currentScope
                          )}`}
                        >
                          {PERMISSION_SCOPE_LABELS[currentScope]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {permission.description}
                      </p>
                    </div>

                    <div className="min-w-[220px]">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Escopo
                      </label>
                      <select
                        value={currentScope}
                        disabled={disabled}
                        onChange={(event) =>
                          onChange(permission.code, event.target.value as PermissionScope)
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {permission.allowedScopes.map((scope) => (
                          <option key={`${permission.code}-${scope}`} value={scope}>
                            {PERMISSION_SCOPE_LABELS[scope]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
