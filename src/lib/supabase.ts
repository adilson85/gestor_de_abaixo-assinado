import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54331';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false, // DESABILITADO - evita loops em mudança de foco
    detectSessionInUrl: false, // Evita problemas de URL
    storage: localStorage,
    flowType: 'pkce', // Recomendado para client-side
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