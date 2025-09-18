import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
}

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    loading: true,
    initialized: false,
  });

  const checkAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .single();

      return !!data && !error;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              isAdmin: false,
              loading: false,
              initialized: true,
            });
          }
          return;
        }

        const user = session?.user ?? null;
        let isAdmin = false;

        if (user) {
          isAdmin = await checkAdminStatus(user.id);
        }

        if (mounted) {
          setAuthState({
            user,
            session,
            isAdmin,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            isAdmin: false,
            loading: false,
            initialized: true,
          });
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const user = session?.user ?? null;
        let isAdmin = false;

        if (user && event !== 'SIGNED_OUT') {
          try {
            isAdmin = await checkAdminStatus(user.id);
          } catch (error) {
            console.error('Error checking admin on auth change:', error);
          }
        }

        setAuthState({
          user,
          session,
          isAdmin,
          loading: false,
          initialized: true,
        });
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  return authState;
};
