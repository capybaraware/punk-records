import { cp } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// web-app directory
const webAppDir = __dirname;
// Project root (one level up from web-app)
const projectRoot = join(webAppDir, '..');
// Source: english directory in project root
const englishSource = join(projectRoot, 'english');
// Destination: english directory in web-app/src/lib/assets
const englishDest = join(webAppDir, 'src', 'lib', 'assets', 'english');

try {
  console.log('Copying english directory from:', englishSource);
  console.log('To:', englishDest);
  
  // Copy the entire english directory
  await cp(englishSource, englishDest, { recursive: true });
  
  console.log('Successfully copied english directory');
} catch (error) {
  console.error('Error copying english directory:', error);
  // Don't fail the build if copy fails - might already exist or path might be different
  console.log('Continuing build anyway...');
}

