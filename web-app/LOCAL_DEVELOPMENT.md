# Running the App Locally

## Prerequisites

- Node.js (version 20.19+, 22.12+, or 24+)
- npm (comes with Node.js)

## Setup Steps

1. **Navigate to the web-app directory:**
   ```bash
   cd web-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   This will install:
   - SvelteKit and related dependencies
   - Supabase client library
   - All other required packages

3. **Set up environment variables (optional):**
   
   The app has fallback values for Supabase, so it will work without a `.env` file. However, if you want to use custom values, create a `.env` file in the `web-app` directory:
   
   ```bash
   # .env
   SUPABASE_URL=https://oboyoemkjegqcpmfvgnr.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ib3lvZW1ramVncWNwbWZ2Z25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg0NTcsImV4cCI6MjA3OTE5NDQ1N30.EwAF3McHRxzIFBvyCRqUe6KsAh8pE1dIvENN7XI-eaU
   ```

4. **Make sure your Supabase database has the cards imported:**
   
   - Go to your Supabase dashboard
   - Open the SQL Editor
   - Run the import scripts in order:
     - `import-cards-part-1.sql`
     - `import-cards-part-2.sql`
     - `import-cards-part-3.sql`
     - `import-cards-part-4.sql`
     - `import-cards-part-5.sql`

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   
   The app should be running at `http://localhost:5173` (or the port shown in the terminal)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run check` - Run type checking
- `npm run check:watch` - Run type checking in watch mode

## Troubleshooting

### Port already in use
If port 5173 is already in use, Vite will automatically try the next available port. Check the terminal output for the actual port.

### Supabase connection issues
- Make sure your Supabase database is accessible
- Verify the cards table exists and has data
- Check the browser console and terminal for error messages

### Module not found errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### TypeScript errors
- Run `npm run check` to see detailed type errors
- Make sure you're using a compatible Node.js version

