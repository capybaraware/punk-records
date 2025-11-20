import { supabase } from './supabase-client';
import type { Card } from './cards';

export async function searchCards(query: string): Promise<Card[]> {
  try {
    // If no query, return empty array
    if (!query || !query.trim()) {
      return [];
    }

    const searchTerm = query.trim();
    // Use .or() with proper PostgREST filter syntax
    // .ilike is case-insensitive (handles "luffy" matching "Monkey.D.Luffy")
    // % wildcards allow partial matching anywhere in the string
    // The %25 you see in the URL is just URL encoding of % - this is normal and correct
    // The actual query sent to PostgreSQL is: card_id ILIKE '%searchTerm%' OR name ILIKE '%searchTerm%'
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .or(`card_id.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Transform the data to match the Card interface
    return (data || []) as Card[];
  } catch (error) {
    console.error('Error searching cards:', error);
    throw error;
  }
}

