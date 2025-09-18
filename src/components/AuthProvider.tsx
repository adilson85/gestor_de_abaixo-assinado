"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type AuthCtx = { 
  user: User | null; 
  session: Session | null; 
  loading: boolean; 
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ 
  user: null, 
  session: null, 
  loading: true, 
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {}
});

export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const booted = useRef(false);

  // Função para verificar admin
  const checkAdmin = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .single();
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe(): void } } } | null = null;
    
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session || null);
      setUser(session?.user || null);
      
      if (session?.user) {
        await checkAdmin(session.user.id);
      }
      
      setLoading(false);
      
      unsub = supabase.auth.onAuthStateChange(async (_evt, s) => {
        setSession(s || null);
        setUser(s?.user || null);
        
        if (s?.user) {
          await checkAdmin(s.user.id);
        } else {
          setIsAdmin(false);
        }
      });
    })();
    
    return () => unsub?.data.subscription.unsubscribe();
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
    <Ctx.Provider value={{ 
      user, 
      session, 
      loading, 
      isAdmin, 
      signIn, 
      signOut 
    }}>
      {children}
    </Ctx.Provider>
  );
}
