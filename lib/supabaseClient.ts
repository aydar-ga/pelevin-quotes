// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yttqhiujdpbmpehyjala.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dHFoaXVqZHBibXBlaHlqYWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NDQ2MTMsImV4cCI6MjA0NTAyMDYxM30.I4QeaB3OvHXjB43I8dmedZQ5vumIiUtj19Qq2LelpvU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
