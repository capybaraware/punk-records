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
  const projectRoot = getProjectRoot();
  const webAppDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const libDir = dirname(fileURLToPath(import.meta.url));
  
  // Try multiple possible locations (in order of preference)
  const possiblePaths = [
    // 1. In web-app/src/lib/assets/english/cards (new location)
    join(libDir, 'assets', 'english', 'cards'),
    // 2. Relative to web-app directory
    join(webAppDir, 'src', 'lib', 'assets', 'english', 'cards'),
    // 3. In web-app/english/cards (copied during build for Vercel - legacy)
    join(webAppDir, 'english', 'cards'),
    // 4. Relative to project root (development/local - legacy)
    join(projectRoot, 'english', 'cards'),
    // 5. Relative to current working directory
    join(cwd, 'english', 'cards'),
    // 6. If we're in web-app, go up one level
    cwd.includes('web-app') ? join(cwd, '..', 'english', 'cards') : null,
    cwd.endsWith('web-app') ? join(cwd, '..', 'english', 'cards') : null,
    // 7. From .svelte-kit build directory
    cwd.includes('.svelte-kit') ? join(cwd, '..', 'src', 'lib', 'assets', 'english', 'cards') : null,
  ].filter((p): p is string => p !== null);
  
  // Try each path
  for (const path of possiblePaths) {
    try {
      const stats = await fs.stat(path);
      if (stats.isDirectory()) {
        console.log('Found cards directory at:', path);
        return path;
      }
    } catch (err) {
      // Path doesn't exist, try next one
      continue;
    }
  }
  
  // If none found, throw error with all attempted paths
  throw new Error(
    `Could not find cards directory. Tried: ${possiblePaths.join(', ')}\n` +
    `Current working directory: ${cwd}\n` +
    `Project root: ${projectRoot}`
  );
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
