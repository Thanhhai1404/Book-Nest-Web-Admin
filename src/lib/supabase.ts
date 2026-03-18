import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client
 *
 * Khuyến nghị: chuyển các giá trị này sang biến môi trường Vite:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
