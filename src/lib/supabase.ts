import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development',
  },
  global: {
    headers: {
      'X-Client-Info': 'gestor-abaixo-assinado@1.0.0',
    },
  },
});

export type Database = {
  public: {
    Tables: {
      petitions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          location: string | null;
          collection_date: string | null;
          responsible: string | null;
          image_url: string | null;
          table_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          location?: string | null;
          collection_date?: string | null;
          responsible?: string | null;
          image_url?: string | null;
          table_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          location?: string | null;
          collection_date?: string | null;
          responsible?: string | null;
          image_url?: string | null;
          table_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};