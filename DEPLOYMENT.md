# Deployment Instructions for Vercel

## Setup

1. **In Vercel Dashboard:**
   - Set the **Root Directory** to the repository root (not `web-app`)
   - The build command is configured in `vercel.json` to run from `web-app`
   - Framework: SvelteKit (should auto-detect with `@sveltejs/adapter-vercel`)

2. **Automatic Card Data Copying:**
   - The `prebuild` script automatically copies the `english` directory into `web-app` before building
   - This ensures the card data is included in the Vercel deployment
   - The copied directory is in `.gitignore` and won't be committed

3. **Adapter Configuration:**
   - Using `@sveltejs/adapter-vercel` for optimal Vercel deployment
   - Output is automatically placed in `.vercel/output` by the adapter

## How It Works

1. **Build Process:**
   - `prebuild` script runs `copy-cards.js` which copies `english/` from project root to `web-app/english/`
   - Then the normal build process runs
   - Vercel packages everything in `web-app`, including the copied card data

2. **Path Resolution:**
   - The code in `web-app/src/lib/cards.ts` tries multiple locations:
     - First: `web-app/english/cards` (copied during build - used in Vercel)
     - Second: `../english/cards` from project root (used in development)
     - Additional fallbacks for different environments
   - This ensures it works in both development and production

## Troubleshooting

If you get a 404 error:
1. Check Vercel build logs to ensure `prebuild` script ran successfully
2. Verify the `english` directory exists in the project root
3. Check Vercel function logs for the actual path being tried
4. Ensure Root Directory is set to repository root in Vercel dashboard

