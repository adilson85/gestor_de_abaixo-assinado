import {
  APP_ROLE_LABELS,
  buildPermissionMap,
  canAccessScopedKanbanTask,
  doesScopeSatisfy,
  getKanbanViewScopeLabel,
  hasPermission,
  hasRequiredRole,
  isAdminRole,
} from '../access';

describe('access helpers', () => {
  it('returns false when there is no current role', () => {
    expect(hasRequiredRole(null, ['admin'])).toBe(false);
    expect(hasRequiredRole(undefined, ['operator'])).toBe(false);
  });

  it('returns true when the current role is allowed', () => {
    expect(hasRequiredRole('admin', ['admin'])).toBe(true);
    expect(hasRequiredRole('operator', ['admin', 'operator'])).toBe(true);
  });

  it('returns false when the current role is not allowed', () => {
    expect(hasRequiredRole('operator', ['admin'])).toBe(false);
  });

  it('identifies admin roles correctly', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('operator')).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });

  it('keeps readable labels for the supported roles', () => {
    expect(APP_ROLE_LABELS.admin).toBe('Administrador');
    expect(APP_ROLE_LABELS.operator).toBe('Operador');
  });

  it('matches compatible scopes correctly', () => {
    expect(doesScopeSatisfy('all', 'assigned')).toBe(true);
    expect(doesScopeSatisfy('assigned', 'assigned')).toBe(true);
    expect(doesScopeSatisfy('own', 'assigned')).toBe(false);
    expect(doesScopeSatisfy('none', 'any')).toBe(false);
  });

  it('checks permission maps with role override', () => {
    const permissions = buildPermissionMap({
      'kanban.view': 'assigned',
      'users.view': 'none',
    });

    expect(hasPermission(permissions, 'kanban.view', 'assigned')).toBe(true);
    expect(hasPermission(permissions, 'kanban.view', 'all')).toBe(false);
    expect(hasPermission(permissions, 'users.view', 'any')).toBe(false);
    expect(hasPermission(null, 'users.view', 'all', 'admin')).toBe(true);
  });

  it('enforces scoped kanban access using creator and assignee', () => {
    const assignedPermissions = buildPermissionMap({
      'kanban.edit': 'assigned',
    });

    const task = {
      createdBy: 'owner-1',
      assignees: [
        {
          userId: 'user-1',
        },
      ],
    } as any;

    expect(canAccessScopedKanbanTask(task, assignedPermissions, 'kanban.edit', 'user-1', 'operator')).toBe(true);
    expect(canAccessScopedKanbanTask(task, assignedPermissions, 'kanban.edit', 'user-2', 'operator')).toBe(false);

    const ownPermissions = buildPermissionMap({
      'kanban.edit': 'own',
    });

    expect(canAccessScopedKanbanTask(task, ownPermissions, 'kanban.edit', 'owner-1', 'operator')).toBe(true);
    expect(canAccessScopedKanbanTask(task, ownPermissions, 'kanban.edit', 'user-1', 'operator')).toBe(false);
  });

  it('describes the current kanban visibility scope for the user', () => {
    const permissions = buildPermissionMap({
      'kanban.view': 'assigned',
    });

    expect(getKanbanViewScopeLabel(permissions, 'operator')).toBe('Você enxerga apenas tarefas atribuídas a você.');
    expect(getKanbanViewScopeLabel(null, 'admin')).toBe('Você enxerga todo o quadro.');
  });
});
