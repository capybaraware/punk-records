# Deployment Instructions for Vercel

## Setup

1. **In Vercel Dashboard:**
   - Set the **Root Directory** to the repository root (not `web-app`)
   - The build command and output directory are already configured in `vercel.json`

2. **Path Resolution:**
   - The code automatically resolves paths relative to the project root
   - From `web-app/src/lib`, it goes up to `web-app`, then up to the project root
   - This allows access to the `english/cards` directory

## How It Works

The path resolution in `web-app/src/lib/cards.ts`:
- Calculates the project root by going up from the current file location
- Constructs the path to `english/cards` relative to the project root
- Works in both development and production environments

## Alternative: If Root Directory Must Be `web-app`

If you need to set the root directory to `web-app` in Vercel, you'll need to:

1. Copy the card directories into `web-app` during build, OR
2. Use environment variables to specify the card data location, OR
3. Store card data in a database or external service

The current setup assumes the root directory is set to the repository root.

