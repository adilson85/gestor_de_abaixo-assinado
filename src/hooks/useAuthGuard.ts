import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PUBLIC_ROUTES = ['/login'];

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const actedRef = useRef(false);
  const lastPathRef = useRef('');

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const checkAuth = async () => {
      try {
        // Evitar múltiplas ações na mesma rota
        if (lastPathRef.current === location.pathname && actedRef.current) {
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth guard error:', error);
          return;
        }

        const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
        
        // Se não tem sessão e não está em rota pública
        if (!session && !isPublicRoute && !actedRef.current && mounted) {
          actedRef.current = true;
          lastPathRef.current = location.pathname;
          navigate('/login', { replace: true });
          return;
        }

        // Se tem sessão e está no login
        if (session && location.pathname === '/login' && !actedRef.current && mounted) {
          actedRef.current = true;
          lastPathRef.current = location.pathname;
          navigate('/dashboard', { replace: true });
          return;
        }

        // Reset flag após navegação bem-sucedida
        if (lastPathRef.current !== location.pathname) {
          actedRef.current = false;
          lastPathRef.current = location.pathname;
        }

      } catch (error) {
        console.error('Auth guard check failed:', error);
      }
    };

    // Check inicial
    checkAuth();

    // Listener para mudanças de auth (mas sem redirecionamentos automáticos)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Só age em eventos específicos para evitar loops
        if (event === 'SIGNED_OUT' && location.pathname !== '/login') {
          actedRef.current = false;
          navigate('/login', { replace: true });
        }
      }
    );

    subscription = authSub;

    // Reset flag quando a rota muda
    const handleRouteChange = () => {
      if (lastPathRef.current !== location.pathname) {
        actedRef.current = false;
      }
    };

    handleRouteChange();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [location.pathname, navigate]);

  // Reset flag quando componente remonta ou rota muda
  useEffect(() => {
    actedRef.current = false;
  }, [location.pathname]);
};
