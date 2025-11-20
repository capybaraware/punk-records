# Supabase Setup

This project now uses Supabase for card data storage instead of JSON files.

## Environment Variables

The following environment variables need to be set:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous/public API key

### Local Development

1. Create a `.env` file in the `web-app` directory (if it doesn't exist)
2. Add the following:

```
SUPABASE_URL=https://oboyoemkjegqcpmfvgnr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ib3lvZW1ramVncWNwbWZ2Z25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg0NTcsImV4cCI6MjA3OTE5NDQ1N30.EwAF3McHRxzIFBvyCRqUe6KsAh8pE1dIvENN7XI-eaU
```

### Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `SUPABASE_URL` = `https://oboyoemkjegqcpmfvgnr.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ib3lvZW1ramVncWNwbWZ2Z25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg0NTcsImV4cCI6MjA3OTE5NDQ1N30.EwAF3McHRxzIFBvyCRqUe6KsAh8pE1dIvENN7XI-eaU`
4. Make sure to set them for all environments (Production, Preview, Development)

## Installation

Make sure to install the Supabase client:

```bash
npm install @supabase/supabase-js
```

## Database Schema

The `cards` table has the following structure:
- `id` (BIGSERIAL PRIMARY KEY) - Auto-incrementing integer
- `card_id` (TEXT) - Original card ID from JSON files (e.g., 'ST01-001')
- `pack_id` (TEXT) - Pack/set identifier
- `name` (TEXT) - Card name
- `rarity` (TEXT) - Card rarity
- `category` (TEXT) - Card category
- `img_url` (TEXT) - Relative image URL
- `img_full_url` (TEXT) - Full image URL
- `colors` (TEXT[]) - Array of card colors
- `cost` (INTEGER) - Card cost (nullable)
- `attributes` (TEXT[]) - Array of card attributes
- `power` (INTEGER) - Card power (nullable)
- `counter` (INTEGER) - Card counter (nullable)
- `types` (TEXT[]) - Array of card types
- `effect` (TEXT) - Card effect text (nullable)
- `trigger` (TEXT) - Card trigger text (nullable)
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Update timestamp

## Importing Cards

Use the SQL import scripts (`import-cards-part-1.sql` through `import-cards-part-5.sql`) to import all card data into Supabase.

