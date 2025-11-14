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

function getCardsDir() {
  const projectRoot = getProjectRoot();
  // Path to english/cards from project root
  // This works when the repo root is the Vercel root directory
  return join(projectRoot, 'english', 'cards');
}

export async function searchCards(query: string): Promise<Card[]> {
  const cardsDir = getCardsDir();
  
  console.log('Searching in directory:', cardsDir);
  console.log('Current working directory:', process.cwd());
  console.log('Project root:', getProjectRoot());
  
  try {
    const stats = await fs.stat(cardsDir);
    console.log('Directory exists and is directory:', stats.isDirectory());
  } catch (err) {
    console.error('Error accessing cards directory:', err);
    throw new Error(`Could not access cards directory at: ${cardsDir}`);
  }
  
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
