import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use Vercel adapter for optimal Vercel deployment
		adapter: adapter({
			// Include the assets directory in serverless functions
			// This ensures card data files are accessible at runtime
			// Note: includeFiles is evaluated during build, so it will see src/lib/assets
			// (created by prebuild) but not assets/ (created by postbuild)
			includeFiles: ['src/lib/assets/**']
		})
	}
};

export default config;
