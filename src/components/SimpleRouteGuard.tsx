import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './SimpleAuthProvider';

const PUBLIC_ROUTES = ['/login'];

export const SimpleRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Só redireciona se não está carregando e ainda não redirecionou
    if (loading || hasRedirected.current) return;

    const isPublic = PUBLIC_ROUTES.includes(location.pathname);

    // Se não está logado e não é rota pública
    if (!isPublic && !user) {
      hasRedirected.current = true;
      navigate('/login', { replace: true });
      return;
    }

    // Se está logado mas não é admin e não é rota pública
    if (!isPublic && user && !isAdmin) {
      hasRedirected.current = true;
      navigate('/login?error=access_denied', { replace: true });
      return;
    }

    // Se está logado como admin e está na página de login
    if (user && isAdmin && location.pathname === '/login') {
      hasRedirected.current = true;
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [loading, user, isAdmin, location.pathname, navigate]);

  return <>{children}</>;
};
