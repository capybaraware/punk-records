import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Supabase configuration
const supabaseUrl = env.SUPABASE_URL || 'https://oboyoemkjegqcpmfvgnr.supabase.co';
const supabaseAnonKey = env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ib3lvZW1ramVncWNwbWZ2Z25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg0NTcsImV4cCI6MjA3OTE5NDQ1N30.EwAF3McHRxzIFBvyCRqUe6KsAh8pE1dIvENN7XI-eaU';

// Create Supabase client for server-side use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

