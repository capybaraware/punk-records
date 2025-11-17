import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { searchCards } from '$lib/cards';

export const GET: RequestHandler = async ({ url }): Promise<Response> => {
  try {
    const query = url.searchParams.get('q') || '';
    const results = await searchCards(query);
    return json(results);
  } catch (err: any) {
    console.error('Search error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error message:', err.message);
    // If it's already an HTTP error, rethrow it
    if (err.status) throw err;
    // Otherwise, create a 500 error with more details
    const errorMessage = err.message || 'An error occurred while searching for cards';
    console.error('Full error details:', JSON.stringify(err, null, 2));
    throw error(500, errorMessage);
  }
};
