"use client";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  { 
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      detectSessionInUrl: true 
    } 
  }
);
