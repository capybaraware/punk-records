-- Row Level Security (RLS) Policy for Cards Table
-- Run this script in your Supabase SQL Editor

-- Enable Row Level Security on the cards table
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (optional - only if you want to recreate)
DROP POLICY IF EXISTS "Allow public read access to cards" ON cards;
DROP POLICY IF EXISTS "Allow anonymous read access to cards" ON cards;

-- Create a policy that allows anyone (including anonymous users) to read all cards
-- This uses the 'anon' role which is what the public API key uses
CREATE POLICY "Allow public read access to cards"
ON cards
FOR SELECT
TO anon, authenticated
USING (true);

-- Optional: If you want to be more explicit and only allow anonymous users
-- (uncomment the following and comment out the above if preferred)
-- CREATE POLICY "Allow anonymous read access to cards"
-- ON cards
-- FOR SELECT
-- TO anon
-- USING (true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'cards';

