import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Supabase configuration for client-side use
// These values are safe to expose in the browser (anon key is public)
const supabaseUrl = 'https://oboyoemkjegqcpmfvgnr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ib3lvZW1ramVncWNwbWZ2Z25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg0NTcsImV4cCI6MjA3OTE5NDQ1N30.EwAF3McHRxzIFBvyCRqUe6KsAh8pE1dIvENN7XI-eaU';

// Create Supabase client for client-side use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

