import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppPermissionCode, AppRole, PermissionScope } from '../types';
import { APP_ROLE_LABELS } from '../utils/access';

interface PermissionRequirement {
  code: AppPermissionCode;
  scopes?: (PermissionScope | 'any')[];
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requiredPermission?: PermissionRequirement;
  requiredAnyPermissions?: PermissionRequirement[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  requiredAnyPermissions,
}) => {
  const { user, role, appUser, canAccessPanel, loading, hasRole, can, canAny } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!canAccessPanel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso indisponível</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sua conta está autenticada, mas não possui um perfil interno ativo para acessar este painel.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Peça para um administrador habilitar seu usuário na área de Usuários.
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles?.length && !hasRole(...allowedRoles)) {
    const currentRoleLabel = role ? APP_ROLE_LABELS[role] : 'Sem papel';
    const requiredLabels = allowedRoles.map((allowedRole) => APP_ROLE_LABELS[allowedRole]).join(' ou ');

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso negado</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            Seu papel atual é <strong>{currentRoleLabel}</strong>, mas esta área exige acesso de{' '}
            <strong>{requiredLabels}</strong>.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Usuário atual: {appUser?.fullName || appUser?.email || user.email}
          </p>
        </div>
      </div>
    );
  }

  if (requiredPermission) {
    const requiredScopes = requiredPermission.scopes || ['all'];
    const hasRequiredPermission = requiredScopes.some((scope) => can(requiredPermission.code, scope));

    if (!hasRequiredPermission) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso negado</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Seu usuário está autenticado, mas esta área exige uma permissão adicional.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Usuário atual: {appUser?.fullName || appUser?.email || user.email}
            </p>
          </div>
        </div>
      );
    }
  }

  if (requiredAnyPermissions?.length && !canAny(requiredAnyPermissions)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso negado</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            Seu usuário está ativo, mas ainda não recebeu nenhuma das permissões necessárias para abrir esta área.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Usuário atual: {appUser?.fullName || appUser?.email || user.email}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
