import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para evitar revalidação excessiva de auth em mudanças de visibilidade
 * Previne loops quando usuário volta para aba/janela
 */
export const useVisibilityGuard = () => {
  const lastCheckRef = useRef(0);
  const isCheckingRef = useRef(false);
  const COOLDOWN_MS = 2000; // 2s entre checks

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Só check quando aba fica visível
      if (document.hidden) return;
      
      const now = Date.now();
      
      // Cooldown para evitar spam de checks
      if (now - lastCheckRef.current < COOLDOWN_MS || isCheckingRef.current) {
        return;
      }

      isCheckingRef.current = true;
      lastCheckRef.current = now;

      try {
        // Apenas refresh silencioso da sessão, sem redirecionamentos
        await supabase.auth.getSession();
      } catch (error) {
        console.error('Visibility auth check failed:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);
};
