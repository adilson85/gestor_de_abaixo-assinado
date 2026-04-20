import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createSessionSupabaseClient, supabase } from '../lib/supabase';
import { AppPermissionCode, AppPermissionMap, AppRole, AppUser, PermissionScope } from '../types';
import { getOwnAppUserProfileWithToken } from '../utils/app-users';
import { buildPermissionMap, hasAnyPermission, hasPermission, hasRequiredRole, isAdminRole } from '../utils/access';
import { fetchCurrentAccess } from '../utils/user-management';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  appUser: AppUser | null;
  role: AppRole | null;
  permissions: AppPermissionMap;
  isAdmin: boolean;
  canAccessPanel: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  hasRole: (...allowedRoles: AppRole[]) => boolean;
  can: (permissionCode: AppPermissionCode, requiredScope?: PermissionScope | 'any') => boolean;
  canAny: (
    requirements: { code: AppPermissionCode; scopes?: (PermissionScope | 'any')[] }[]
  ) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const buildSessionProfile = (
  sessionUser: User,
  role: AppRole,
  permissions: AppPermissionMap,
  profile?: AppUser | null
): AppUser => ({
  userId: profile?.userId || sessionUser.id,
  email: profile?.email || sessionUser.email || '',
  fullName:
    profile?.fullName ||
    (typeof sessionUser.user_metadata?.full_name === 'string' ? sessionUser.user_metadata.full_name : undefined),
  role,
  isActive: profile?.isActive ?? true,
  createdBy: profile?.createdBy,
  createdAt: profile?.createdAt || new Date(),
  updatedAt: profile?.updatedAt || new Date(),
  permissions,
});

const loadAccessFallback = async (
  session: Session
): Promise<{ role: AppRole | null; appUser: AppUser | null; permissions: AppPermissionMap }> => {
  const sessionClient = createSessionSupabaseClient(session.access_token);
  const { data: roleData, error: roleError } = await sessionClient.rpc('get_my_role');

  if (roleError) {
    throw new Error(roleError.message || 'Falha ao verificar permissoes do usuario.');
  }

  const role = roleData as AppRole | null;
  if (!role) {
    return { role: null, appUser: null, permissions: buildPermissionMap() };
  }

  let profile: AppUser | null = null;
  let permissions = buildPermissionMap();

  try {
    profile = await getOwnAppUserProfileWithToken(session.user.id, session.access_token);
    permissions = buildPermissionMap(profile?.permissions);
  } catch (profileError) {
    console.warn('Nao foi possivel carregar o perfil via fallback local:', profileError);
  }

  const { data: permissionsData, error: permissionsError } = await sessionClient.rpc('get_my_permissions');
  if (!permissionsError && permissionsData && typeof permissionsData === 'object') {
    permissions = buildPermissionMap(permissionsData as Partial<Record<AppPermissionCode, PermissionScope>>);
  }

  return {
    role,
    permissions,
    appUser: buildSessionProfile(session.user, role, permissions, profile),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<AppPermissionMap>(buildPermissionMap());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const applyAnonymousState = () => {
      if (!mounted) {
        return;
      }

      setSession(null);
      setUser(null);
      setAppUser(null);
      setRole(null);
      setPermissions(buildPermissionMap());
      setLoading(false);
    };

    const applyAuthenticatedState = async (activeSession: Session) => {
      if (!mounted) {
        return;
      }

      setLoading(true);
      setSession(activeSession);
      setUser(activeSession.user);

      try {
        const access = await fetchCurrentAccess(activeSession);

        if (!mounted) {
          return;
        }

        setRole(access.role);
        const resolvedPermissions = buildPermissionMap(access.permissions);
        setPermissions(resolvedPermissions);
        setAppUser(
          access.role
            ? access.profile || buildSessionProfile(activeSession.user, access.role, resolvedPermissions, access.profile)
            : null
        );
      } catch (accessError) {
        console.warn('Falha ao consultar acesso via Edge Function. Tentando fallback local...', accessError);

        try {
          const fallback = await loadAccessFallback(activeSession);

          if (!mounted) {
            return;
          }

          setRole(fallback.role);
          setPermissions(fallback.permissions);
          setAppUser(fallback.appUser);
        } catch (fallbackError) {
          console.error('Falha ao carregar acesso do usuario:', fallbackError);

          if (!mounted) {
            return;
          }

          setRole(null);
          setAppUser(null);
          setPermissions(buildPermissionMap());
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!currentSession?.user) {
          applyAnonymousState();
          return;
        }

        await applyAuthenticatedState(currentSession);
      } catch (error) {
        console.error('Erro ao inicializar autenticacao:', error);
        applyAnonymousState();
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!nextSession?.user) {
        applyAnonymousState();
        return;
      }

      await applyAuthenticatedState(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setAppUser(null);
    setRole(null);
    setPermissions(buildPermissionMap());
  };

  const isAdmin = isAdminRole(role);
  const canAccessPanel = !!appUser?.isActive;
  const hasRoleAccess = (...allowedRoles: AppRole[]) => hasRequiredRole(role, allowedRoles);
  const canAccessPermission = (permissionCode: AppPermissionCode, requiredScope: PermissionScope | 'any' = 'all') =>
    hasPermission(permissions, permissionCode, requiredScope, role);
  const canAccessAnyPermission = (
    requirements: { code: AppPermissionCode; scopes?: (PermissionScope | 'any')[] }[]
  ) => hasAnyPermission(permissions, requirements, role);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        appUser,
        role,
        permissions,
        isAdmin,
        canAccessPanel,
        loading,
        signIn,
        signOut,
        hasRole: hasRoleAccess,
        can: canAccessPermission,
        canAny: canAccessAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
