import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { searchCards } from '$lib/cards';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current directory name in a way that works in both ESM and CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the absolute path to the project root
export const GET: RequestHandler = async ({ url }): Promise<Response> => {
  try {
    const query = url.searchParams.get('q') || '';
    // Use an absolute path to the english/cards directory
    const cardsDir = 'c:\\repos\\punk-records\\english\\cards';
    
    // Log the current working directory for debugging
    console.log('Current working directory:', process.cwd());
    console.log('Using cards directory:', cardsDir);
    
    // Verify the cards directory exists
    try {
      const stats = await import('fs/promises').then(fs => fs.stat(cardsDir));
      console.log('Directory exists and is directory:', stats.isDirectory());
    } catch (err) {
      console.error('Error accessing cards directory:', err);
      throw error(404, `Cards directory not found at: ${cardsDir}`);
    }
    
    const results = await searchCards(query);
    return json(results);
  } catch (err: any) {
    console.error('Search error:', err);
    // If it's already an HTTP error, rethrow it
    if (err.status) throw err;
    // Otherwise, create a 500 error
    throw error(500, 'An error occurred while searching for cards');
  }
};
