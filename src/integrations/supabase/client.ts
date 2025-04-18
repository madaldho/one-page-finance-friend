
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pjwmfyvknbtoofxfuwjm.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqd21meXZrbmJ0b29meGZ1d2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3OTQ2NTgsImV4cCI6MjA2MDM3MDY1OH0.yrje_gdq9gODnMZbxUO6giRz4ID4SOpcmBlBOIDOK1U";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
