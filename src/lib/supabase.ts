import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54341';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const browserAuthConfig = {
  persistSession: true,
  autoRefreshToken: false, // DESABILITADO - evita loops em mudanca de foco
  detectSessionInUrl: false, // Evita problemas de URL
  storage: localStorage,
  flowType: 'pkce' as const, // Recomendado para client-side
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...browserAuthConfig,
  },
});

export const createSessionSupabaseClient = (accessToken: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
