import {
  AppPermissionCode,
  AppPermissionDefinition,
  AppPermissionMap,
  AppRole,
  KanbanTask,
  PermissionScope,
} from '../types';

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  operator: 'Operador',
};

export const PERMISSION_SCOPE_LABELS: Record<PermissionScope, string> = {
  none: 'Sem acesso',
  own: 'Somente o que criou',
  assigned: 'Somente atribuído',
  all: 'Acesso total',
};

export const APP_PERMISSION_DEFINITIONS: AppPermissionDefinition[] = [
  {
    code: 'dashboard.view',
    module: 'dashboard',
    label: 'Ver dashboard',
    description: 'Acessa os indicadores gerais do painel.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'petitions.view',
    module: 'petitions',
    label: 'Ver campanhas',
    description: 'Lista campanhas e abre detalhes operacionais.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'petitions.create',
    module: 'petitions',
    label: 'Criar campanhas',
    description: 'Cria novos abaixo-assinados no painel.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'petitions.edit',
    module: 'petitions',
    label: 'Editar campanhas',
    description: 'Altera dados operacionais e materiais da campanha.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'petitions.publish',
    module: 'petitions',
    label: 'Publicar campanhas',
    description: 'Liga ou desliga a pagina publica da campanha.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'petitions.delete',
    module: 'petitions',
    label: 'Excluir campanhas',
    description: 'Remove campanhas e os dados vinculados.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'signatures.view',
    module: 'signatures',
    label: 'Ver assinaturas',
    description: 'Consulta a base de apoios captados.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'signatures.create_manual',
    module: 'signatures',
    label: 'Adicionar assinaturas manualmente',
    description: 'Digitaliza e salva apoios coletados fora da pagina publica.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'signatures.edit',
    module: 'signatures',
    label: 'Editar assinaturas',
    description: 'Corrige dados de apoiadores ja cadastrados.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'signatures.delete',
    module: 'signatures',
    label: 'Excluir assinaturas',
    description: 'Apaga registros de apoio.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'signatures.export',
    module: 'signatures',
    label: 'Exportar assinaturas',
    description: 'Baixa CSV e outras saidas de analise.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'signatures.message_status',
    module: 'signatures',
    label: 'Atualizar status de mensagem',
    description: 'Marca follow-up como enviado ou pendente.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'petition_resources.manage',
    module: 'petitions',
    label: 'Gerenciar links e recursos',
    description: 'Adiciona e remove links, videos e materiais da campanha.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.view',
    module: 'kanban',
    label: 'Ver Kanban',
    description: 'Acompanha o quadro e os cards da operacao.',
    allowedScopes: ['none', 'own', 'assigned', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.create',
    module: 'kanban',
    label: 'Criar cards',
    description: 'Abre novas tarefas no quadro.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.edit',
    module: 'kanban',
    label: 'Editar cards',
    description: 'Altera titulo, descricao, prioridade e prazo das tarefas.',
    allowedScopes: ['none', 'own', 'assigned', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.move',
    module: 'kanban',
    label: 'Mover cards',
    description: 'Move tarefas entre colunas e atualiza etapa.',
    allowedScopes: ['none', 'own', 'assigned', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.archive',
    module: 'kanban',
    label: 'Arquivar cards',
    description: 'Arquiva ou restaura tarefas do quadro.',
    allowedScopes: ['none', 'own', 'assigned', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.delete',
    module: 'kanban',
    label: 'Excluir cards',
    description: 'Remove tarefas definitivamente.',
    allowedScopes: ['none', 'own', 'assigned', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'kanban.assign_users',
    module: 'kanban',
    label: 'Atribuir responsaveis',
    description: 'Define quem fica responsavel por cada tarefa.',
    allowedScopes: ['none', 'own', 'assigned', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.manage_labels',
    module: 'kanban',
    label: 'Gerenciar etiquetas',
    description: 'Aplica e cria etiquetas no Kanban.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.comment',
    module: 'kanban',
    label: 'Comentar',
    description: 'Comenta e acompanha a conversa nos cards.',
    allowedScopes: ['none', 'own', 'assigned', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.attachment',
    module: 'kanban',
    label: 'Gerenciar anexos',
    description: 'Adiciona e remove links ou arquivos nas tarefas.',
    allowedScopes: ['none', 'own', 'assigned', 'all'],
    defaultOperatorScope: 'all',
  },
  {
    code: 'kanban.manage_columns',
    module: 'kanban',
    label: 'Gerenciar colunas',
    description: 'Altera a estrutura do quadro.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'kanban.manage_deadlines',
    module: 'kanban',
    label: 'Gerenciar prazos de etapa',
    description: 'Configura vencimentos automaticos por coluna.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'users.view',
    module: 'users',
    label: 'Ver usuarios',
    description: 'Acompanha equipe ativa, status e resumo de acessos.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'users.create',
    module: 'users',
    label: 'Criar usuarios',
    description: 'Convida ou cria novos acessos internos.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'users.edit_profile',
    module: 'users',
    label: 'Editar perfil de usuarios',
    description: 'Altera nome e papel-base dos acessos internos.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'users.edit_permissions',
    module: 'users',
    label: 'Editar permissoes',
    description: 'Define o que cada usuario pode fazer no painel.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'users.reset_password',
    module: 'users',
    label: 'Gerar senha temporaria',
    description: 'Reseta a senha e entrega uma credencial provisoria.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'users.deactivate',
    module: 'users',
    label: 'Desativar usuarios',
    description: 'Suspende ou reativa acessos internos.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'settings.backup_export',
    module: 'settings',
    label: 'Exportar backup',
    description: 'Gera backup operacional da base.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'settings.backup_import',
    module: 'settings',
    label: 'Importar backup',
    description: 'Substitui a base operacional por um pacote importado.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'settings.audit_view',
    module: 'settings',
    label: 'Ver auditoria',
    description: 'Consulta historico de acoes administrativas.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
  {
    code: 'settings.wipe_data',
    module: 'settings',
    label: 'Limpar dados',
    description: 'Executa a limpeza global da operacao.',
    allowedScopes: ['none', 'all'],
    defaultOperatorScope: 'none',
  },
];

export const APP_PERMISSION_DEFINITION_MAP = Object.fromEntries(
  APP_PERMISSION_DEFINITIONS.map((permission) => [permission.code, permission])
) as Record<AppPermissionCode, AppPermissionDefinition>;

export const APP_PERMISSION_CODES = APP_PERMISSION_DEFINITIONS.map(
  (permission) => permission.code
) as AppPermissionCode[];

export const DEFAULT_OPERATOR_PERMISSION_MAP = APP_PERMISSION_DEFINITIONS.reduce((acc, permission) => {
  acc[permission.code] = permission.defaultOperatorScope;
  return acc;
}, {} as AppPermissionMap);

export const EMPTY_PERMISSION_MAP = APP_PERMISSION_DEFINITIONS.reduce((acc, permission) => {
  acc[permission.code] = 'none';
  return acc;
}, {} as AppPermissionMap);

export const KANBAN_ROUTE_SCOPES: PermissionScope[] = ['own', 'assigned', 'all'];
export const SETTINGS_ROUTE_PERMISSION_CODES: AppPermissionCode[] = [
  'kanban.manage_deadlines',
  'kanban.manage_columns',
  'settings.backup_export',
  'settings.backup_import',
  'settings.audit_view',
  'settings.wipe_data',
];

export const getHighestScope = (
  permissions: AppPermissionMap | null | undefined,
  permissionCode: AppPermissionCode,
  role?: AppRole | null
): PermissionScope => {
  if (isAdminRole(role)) {
    return 'all';
  }

  return getPermissionScope(permissions, permissionCode);
};

export const getKanbanViewScopeLabel = (
  permissions: AppPermissionMap | null | undefined,
  role?: AppRole | null
): string => {
  const scope = getHighestScope(permissions, 'kanban.view', role);

  switch (scope) {
    case 'all':
      return 'Você enxerga todo o quadro.';
    case 'assigned':
      return 'Você enxerga apenas tarefas atribuídas a você.';
    case 'own':
      return 'Você enxerga apenas tarefas criadas por você.';
    default:
      return 'Sem acesso ao quadro.';
  }
};

export const buildPermissionMap = (
  overrides?: Partial<Record<AppPermissionCode, PermissionScope>> | null
): AppPermissionMap => {
  const nextMap: AppPermissionMap = { ...EMPTY_PERMISSION_MAP };

  if (!overrides) {
    return nextMap;
  }

  APP_PERMISSION_CODES.forEach((code) => {
    const scope = overrides[code];
    if (scope) {
      nextMap[code] = scope;
    }
  });

  return nextMap;
};

export const buildDefaultOperatorPermissionMap = (): AppPermissionMap => ({
  ...DEFAULT_OPERATOR_PERMISSION_MAP,
});

export const isAdminRole = (role: AppRole | null | undefined): boolean => role === 'admin';

export const hasRequiredRole = (
  currentRole: AppRole | null | undefined,
  allowedRoles: AppRole[]
): boolean => {
  if (!currentRole) {
    return false;
  }

  return allowedRoles.includes(currentRole);
};

export const doesScopeSatisfy = (
  actualScope: PermissionScope | null | undefined,
  requiredScope: PermissionScope | 'any' = 'all'
): boolean => {
  if (!actualScope || actualScope === 'none') {
    return false;
  }

  if (requiredScope === 'any') {
    return actualScope !== 'none';
  }

  if (requiredScope === 'all') {
    return actualScope === 'all';
  }

  if (requiredScope === 'assigned') {
    return actualScope === 'assigned' || actualScope === 'all';
  }

  if (requiredScope === 'own') {
    return actualScope === 'own' || actualScope === 'all';
  }

  return actualScope !== 'none';
};

export const getPermissionScope = (
  permissions: AppPermissionMap | null | undefined,
  permissionCode: AppPermissionCode
): PermissionScope => permissions?.[permissionCode] || 'none';

export const canAccessScopedKanbanTask = (
  task: Pick<KanbanTask, 'createdBy' | 'assignees'>,
  permissions: AppPermissionMap | null | undefined,
  permissionCode:
    | 'kanban.view'
    | 'kanban.edit'
    | 'kanban.move'
    | 'kanban.archive'
    | 'kanban.delete'
    | 'kanban.assign_users'
    | 'kanban.comment'
    | 'kanban.attachment',
  currentUserId?: string | null,
  role?: AppRole | null
): boolean => {
  if (isAdminRole(role)) {
    return true;
  }

  const scope = getPermissionScope(permissions, permissionCode);
  if (!currentUserId || scope === 'none') {
    return false;
  }

  if (scope === 'all') {
    return true;
  }

  if (scope === 'own') {
    return task.createdBy === currentUserId;
  }

  if (scope === 'assigned') {
    return task.assignees?.some((assignee) => assignee.userId === currentUserId) || false;
  }

  return false;
};

export const hasPermission = (
  permissions: AppPermissionMap | null | undefined,
  permissionCode: AppPermissionCode,
  requiredScope: PermissionScope | 'any' = 'all',
  role?: AppRole | null
): boolean => {
  if (isAdminRole(role)) {
    return true;
  }

  return doesScopeSatisfy(getPermissionScope(permissions, permissionCode), requiredScope);
};

export const hasAnyPermission = (
  permissions: AppPermissionMap | null | undefined,
  requirements: { code: AppPermissionCode; scopes?: (PermissionScope | 'any')[] }[],
  role?: AppRole | null
): boolean =>
  requirements.some((requirement) => {
    const requiredScopes = requirement.scopes || ['all'];
    return requiredScopes.some((scope) => hasPermission(permissions, requirement.code, scope, role));
  });

export const getModulePermissionDefinitions = (module: AppPermissionDefinition['module']) =>
  APP_PERMISSION_DEFINITIONS.filter((permission) => permission.module === module);

export const getPermissionBadgeTone = (scope: PermissionScope) => {
  switch (scope) {
    case 'all':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200';
    case 'assigned':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200';
    case 'own':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
};

export const getPermissionSummary = (permissions: AppPermissionMap | null | undefined, role?: AppRole | null) => {
  if (isAdminRole(role)) {
    return {
      grantedCount: APP_PERMISSION_CODES.length,
      restrictedCount: 0,
      summaryLabel: 'Acesso total',
    };
  }

  if (!permissions) {
    return {
      grantedCount: 0,
      restrictedCount: APP_PERMISSION_CODES.length,
      summaryLabel: 'Resumo de permissões indisponível',
    };
  }

  const grantedCount = APP_PERMISSION_CODES.filter((code) =>
    hasPermission(permissions, code, 'any', role)
  ).length;

  return {
    grantedCount,
    restrictedCount: APP_PERMISSION_CODES.length - grantedCount,
    summaryLabel: grantedCount === 0 ? 'Sem módulos liberados' : `${grantedCount} permissões ativas`,
  };
};
