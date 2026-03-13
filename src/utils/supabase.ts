import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxybaecnqlhiofpuqnil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eWJhZWNucWxoaW9mcHVxbmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDkwMTgsImV4cCI6MjA4ODI4NTAxOH0.pADeQzLgFHHwfnbomJUgKgPRwdJXRZMAq354XWmZZBI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
