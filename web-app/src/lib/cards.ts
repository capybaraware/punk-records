import { promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface Card {
  id: string;
  name: string;
  rarity: string;
  category: string;
  img_url: string;
  img_full_url: string;
  colors: string[];
  cost: number;
  attributes: string[];
  power: number;
  counter: number | null;
  types: string[];
  effect: string | null;
  trigger: string | null;
}

// This is a helper to get the project root path
function getProjectRoot() {
  // Get the directory of the current file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  // From web-app/src/lib, go up to web-app, then up to project root
  const webAppDir = resolve(__dirname, '../..');
  const projectRoot = resolve(webAppDir, '..');
  
  return projectRoot;
}

async function findCardsDirectory(): Promise<string> {
  const cwd = process.cwd();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  // In Vercel serverless, files included via includeFiles are accessible
  // relative to the function's working directory (/var/task)
  // The includeFiles pattern 'src/lib/assets/**' should preserve the path structure
  
  // Generate paths by walking up from __dirname
  const generatePathsFromDir = (startDir: string): string[] => {
    const paths: string[] = [];
    let current = startDir;
    for (let i = 0; i < 15; i++) {
      paths.push(join(current, 'src', 'lib', 'assets', 'english', 'cards'));
      paths.push(join(current, 'assets', 'english', 'cards'));
      paths.push(join(current, 'english', 'cards'));
      const parent = resolve(current, '..');
      if (parent === current) break; // Reached filesystem root
      current = parent;
    }
    return paths;
  };
  
  // Try multiple possible locations (in order of preference)
  // Based on build output, files are copied to:
  // - .svelte-kit/output/server/assets/english (during build)
  // - .vercel/output/assets/english (during build)
  // - assets/english (during build)
  // At runtime in /var/task, includeFiles should make src/lib/assets/** accessible
  const possiblePaths = [
    // 1. From working directory with preserved src/lib/assets structure (Vercel includeFiles)
    // This is the primary path - includeFiles: ['src/lib/assets/**'] should make this work
    join(cwd, 'src', 'lib', 'assets', 'english', 'cards'),
    // 2. From /var/task/assets (postbuild copy location - if included in function bundle)
    join(cwd, 'assets', 'english', 'cards'),
    // 3. Walk up from __dirname to find the directory (most reliable fallback)
    ...generatePathsFromDir(__dirname),
    // 4. From .svelte-kit/output/server/assets (if still accessible at runtime)
    join(cwd, '.svelte-kit', 'output', 'server', 'assets', 'english', 'cards'),
    // 5. From .vercel/output/assets (if still accessible at runtime)
    join(cwd, '.vercel', 'output', 'assets', 'english', 'cards'),
    // 6. From current working directory (alternative structures)
    join(cwd, 'lib', 'assets', 'english', 'cards'),
    join(cwd, 'english', 'cards'),
  ];
  
  console.log('Attempting to find cards directory...');
  console.log('Current working directory:', cwd);
  console.log('__filename:', __filename);
  console.log('__dirname:', __dirname);
  
  // Try each path
  for (const path of possiblePaths) {
    try {
      const stats = await fs.stat(path);
      if (stats.isDirectory()) {
        // Verify it actually contains card files
        const contents = await fs.readdir(path);
        if (contents.length > 0) {
          console.log('Found cards directory at:', path);
          console.log('Directory contents:', contents.slice(0, 5), '...');
          return path;
        }
      }
    } catch (err: any) {
      // Path doesn't exist, try next one
      continue;
    }
  }
  
  // If none found, try to list what's actually in the working directory for debugging
  let debugInfo = `Could not find cards directory.\n`;
  debugInfo += `Current working directory: ${cwd}\n`;
  debugInfo += `__filename: ${__filename}\n`;
  debugInfo += `__dirname: ${__dirname}\n`;
  
  try {
    const cwdContents = await fs.readdir(cwd);
    debugInfo += `\nContents of working directory (${cwd}):\n${cwdContents.slice(0, 20).join(', ')}\n`;
  } catch (e) {
    debugInfo += `\nCould not read working directory: ${e}\n`;
  }
  
  try {
    const dirnameContents = await fs.readdir(__dirname);
    debugInfo += `\nContents of __dirname (${__dirname}):\n${dirnameContents.slice(0, 20).join(', ')}\n`;
  } catch (e) {
    debugInfo += `\nCould not read __dirname: ${e}\n`;
  }
  
  debugInfo += `\nTried paths:\n${possiblePaths.slice(0, 20).map((p, i) => `  ${i + 1}. ${p}`).join('\n')}\n`;
  if (possiblePaths.length > 20) {
    debugInfo += `  ... and ${possiblePaths.length - 20} more paths\n`;
  }
  
  console.error(debugInfo);
  throw new Error(debugInfo);
}

export async function searchCards(query: string): Promise<Card[]> {
  const cardsDir = await findCardsDirectory();
  
  console.log('Searching in directory:', cardsDir);
  console.log('Current working directory:', process.cwd());
  console.log('Project root:', getProjectRoot());
  
  const results: Card[] = [];
  
  try {
    // Get all set directories
    const setDirs = (await fs.readdir(cardsDir, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Search through each set
    for (const setDir of setDirs) {
      const setPath = join(cardsDir, setDir);
      const cardFiles = (await fs.readdir(setPath))
        .filter(file => file.endsWith('.json'));
      
      for (const file of cardFiles) {
        try {
          const filePath = join(setPath, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const card: Card = JSON.parse(fileContent);
          
          // Check if the card matches the search query (case-insensitive)
          if (query === '' || 
              card.id.toLowerCase().includes(query.toLowerCase()) || 
              card.name.toLowerCase().includes(query.toLowerCase())) {
            results.push(card);
          }
        } catch (err) {
          console.error(`Error reading card file ${file}:`, err);
          // Continue with the next file if there's an error with this one
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error searching cards:', error);
  }
  
  return results;
}
