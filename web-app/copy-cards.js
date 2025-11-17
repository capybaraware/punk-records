import { cp } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

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
  
  // Check if source exists
  if (!existsSync(englishSource)) {
    console.warn(`Source directory ${englishSource} does not exist. Skipping copy.`);
    process.exit(0);
  }
  
  // Copy the entire english directory
  await cp(englishSource, englishDest, { recursive: true, force: true });
  
  console.log('Successfully copied english directory');
  console.log('Verifying copy...');
  
  // Verify the copy was successful
  if (existsSync(englishDest)) {
    const stats = await import('fs/promises').then(m => m.stat(englishDest));
    console.log(`Destination exists and is a ${stats.isDirectory() ? 'directory' : 'file'}`);
  } else {
    throw new Error('Copy completed but destination does not exist');
  }
} catch (error: any) {
  console.error('Error copying english directory:', error);
  console.error('Error details:', error.message);
  // Fail the build if copy fails - we need these files
  process.exit(1);
}

