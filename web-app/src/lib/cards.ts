import { supabase } from './supabase';

// Database card interface (matches Supabase schema)
export interface Card {
  id: number; // Auto-incrementing primary key
  card_id: string; // Original card ID from JSON (e.g., 'ST01-001')
  pack_id: string;
  name: string;
  rarity: string;
  category: string;
  img_url: string;
  img_full_url: string;
  colors: string[];
  cost: number | null;
  attributes: string[];
  power: number | null;
  counter: number | null;
  types: string[];
  effect: string | null;
  trigger: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function searchCards(query: string): Promise<Card[]> {
  try {
    let supabaseQuery = supabase
      .from('cards')
      .select('*');

    // If there's a search query, filter by card_id or name
    if (query && query.trim() !== '') {
      const searchTerm = query.trim();
      // Use .or() with proper PostgREST filter syntax
      // .ilike is case-insensitive, and we use % wildcards for partial matching
      supabaseQuery = supabaseQuery.or(
        `card_id.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`
      );
    }

    // Execute the query
    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Transform the data to match the Card interface
    // The database returns all fields, so we just need to ensure types are correct
    return (data || []) as Card[];
  } catch (error) {
    console.error('Error searching cards:', error);
    throw error;
  }
}
