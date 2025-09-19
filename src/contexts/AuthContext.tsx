import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialized = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkAdmin = async (userId: string) => {
      try {
        // Lista hardcoded de admins para contornar problemas de RLS
        const adminUserIds = [
          '624c6a0e-87d9-4005-9f08-9953e8860ad4', // matheus.mira@cvj.sc.gov.br
          '24151887-fefb-44fe-a2e3-1eef585a9468'  // adilson.martins.jlle@gmail.com
        ];
        
        const isAdminUser = adminUserIds.includes(userId);
        
        if (mounted) {
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.log('Admin check error:', error);
        if (mounted) {
          setIsAdmin(false);
        }
      }
    };

    const initAuth = async () => {
      if (initialized) return; // Evita múltiplas inicializações
      initialized = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await checkAdmin(session.user.id);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listener com debounce para evitar múltiplas chamadas
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Debounce para evitar múltiplas chamadas
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          if (!mounted) return;
          
          // Só reage a eventos importantes, não a refresh de token
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user && event === 'SIGNED_IN') {
              checkAdmin(session.user.id);
            } else {
              setIsAdmin(false);
            }
          }
        }, 100); // 100ms de debounce
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAdmin,
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};