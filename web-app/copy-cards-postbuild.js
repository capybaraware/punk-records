import { cp } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// web-app directory
const webAppDir = __dirname;
// Source: english directory that was copied during prebuild
const englishSource = join(webAppDir, 'src', 'lib', 'assets', 'english');

// Copy to locations that will be included in the serverless function
const destinations = [
  // Copy to .svelte-kit/output/server/assets (for serverless functions)
  join(webAppDir, '.svelte-kit', 'output', 'server', 'assets', 'english'),
  // Copy to .vercel/output (if it exists)
  join(webAppDir, '.vercel', 'output', 'assets', 'english'),
  // Copy to root assets directory (accessible from /var/task in Vercel)
  join(webAppDir, 'assets', 'english'),
];

try {
  if (!existsSync(englishSource)) {
    console.warn(`Source directory ${englishSource} does not exist. Skipping postbuild copy.`);
    process.exit(0);
  }

  console.log('Postbuild: Copying english directory for serverless functions...');
  console.log('Source:', englishSource);

  for (const dest of destinations) {
    try {
      // Create the directory structure if it doesn't exist
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      await cp(englishSource, dest, { recursive: true, force: true });
      console.log(`Successfully copied to: ${dest}`);
    } catch (error) {
      // Don't fail if a destination doesn't exist or can't be written to
      console.warn(`Could not copy to ${dest}:`, error.message);
    }
  }

  console.log('Postbuild copy completed');
} catch (error) {
  console.error('Error in postbuild copy:', error);
  // Don't fail the build - the files might already be in the right place
  console.log('Continuing...');
}

