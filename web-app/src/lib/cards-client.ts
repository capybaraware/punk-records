import { supabase } from './supabase-client';
import type { Card } from './cards';

export interface CardFilters {
  colors?: string[];
  costMin?: number;
  costMax?: number;
  powerMin?: number;
  powerMax?: number;
  counterMin?: number;
  counterMax?: number;
  attributes?: string[];
  types?: string[];
  hasTrigger?: boolean;
}

export async function searchCards(query: string, filters: CardFilters = {}): Promise<Card[]> {
  try {
    let supabaseQuery = supabase.from('cards').select('*');

    // Build search conditions for name/card_id
    if (query && query.trim()) {
      const searchTerm = query.trim();
      // Search by card_id or name
      supabaseQuery = supabaseQuery.or(`card_id.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
    }

    // Color filter
    if (filters.colors && filters.colors.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('colors', filters.colors);
    }

    // Cost filter
    if (filters.costMin !== undefined) {
      supabaseQuery = supabaseQuery.gte('cost', filters.costMin);
    }
    if (filters.costMax !== undefined) {
      supabaseQuery = supabaseQuery.lte('cost', filters.costMax);
    }

    // Power filter
    if (filters.powerMin !== undefined) {
      supabaseQuery = supabaseQuery.gte('power', filters.powerMin);
    }
    if (filters.powerMax !== undefined) {
      supabaseQuery = supabaseQuery.lte('power', filters.powerMax);
    }

    // Counter filter
    if (filters.counterMin !== undefined) {
      supabaseQuery = supabaseQuery.gte('counter', filters.counterMin);
    }
    if (filters.counterMax !== undefined) {
      supabaseQuery = supabaseQuery.lte('counter', filters.counterMax);
    }

    // Attributes filter
    if (filters.attributes && filters.attributes.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('attributes', filters.attributes);
    }

    // Types filter
    if (filters.types && filters.types.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('types', filters.types);
    }

    // Trigger filter
    if (filters.hasTrigger !== undefined) {
      if (filters.hasTrigger) {
        supabaseQuery = supabaseQuery.not('trigger', 'is', null);
      } else {
        supabaseQuery = supabaseQuery.is('trigger', null);
      }
    }

    // Execute the query
    const { data, error } = await supabaseQuery;

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

