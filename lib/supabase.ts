
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvkseblqvqtxdvfslmfe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__D24JCj7Rau8uQXerxXN7A_EIJ05XsG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
