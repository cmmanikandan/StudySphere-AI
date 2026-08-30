import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rcgoetiburrplpbuxiof.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vXdvDcx3z5v9RTftG7iPGg_oEen9D8m';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
