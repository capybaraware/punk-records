import { promises as fs } from 'fs';
import { join } from 'path';

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
  // In development, we might be in .svelte-kit directory
  const cwd = process.cwd();
  if (cwd.endsWith('.svelte-kit')) {
    return join(cwd, '..');
  }
  return cwd;
}

export async function searchCards(query: string): Promise<Card[]> {
  // Use the absolute path to the cards directory
  const cardsDir = 'c:\\repos\\punk-records\\english\\cards';
  
  console.log('Searching in directory:', cardsDir);
  console.log('Current working directory:', process.cwd());
  
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
