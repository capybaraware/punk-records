import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the cards directory
const cardsDir = join(__dirname, 'src', 'lib', 'assets', 'english', 'cards');
const outputFile = join(__dirname, 'import-cards.sql');

// SQL escaping helper
function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Convert array to PostgreSQL array format
function arrayToSQL(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 'ARRAY[]::text[]';
  return `ARRAY[${arr.map(item => escapeSQL(item)).join(', ')}]`;
}

async function generateSQL() {
  console.log('Reading card files from:', cardsDir);
  
  // Read all set directories
  const setDirs = (await fs.readdir(cardsDir, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Found ${setDirs.length} set directories`);

  const cards = [];
  let totalFiles = 0;

  // Read all card files
  for (const setDir of setDirs) {
    const setPath = join(cardsDir, setDir);
    const cardFiles = (await fs.readdir(setPath))
      .filter(file => file.endsWith('.json'));

    for (const file of cardFiles) {
      try {
        const filePath = join(setPath, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const card = JSON.parse(fileContent);
        cards.push(card);
        totalFiles++;
      } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
      }
    }
  }

  console.log(`Loaded ${cards.length} cards from ${totalFiles} files`);

  // Split cards into 5 chunks
  const numChunks = 5;
  const chunkSize = Math.ceil(cards.length / numChunks);
  const chunks = [];
  
  for (let i = 0; i < cards.length; i += chunkSize) {
    chunks.push(cards.slice(i, i + chunkSize));
  }

  console.log(`\nSplitting into ${chunks.length} chunks:`);
  chunks.forEach((chunk, i) => {
    console.log(`  Chunk ${i + 1}: ${chunk.length} cards`);
  });

  // Generate table creation SQL (only in first file)
  const tableSQL = `-- One Piece Card Game - Import Script (Part 1 of ${numChunks})
-- Generated from ${cards.length} card files
-- Run this script FIRST in your Supabase SQL editor

-- Create the cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS cards (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  category TEXT NOT NULL,
  img_url TEXT NOT NULL,
  img_full_url TEXT NOT NULL,
  colors TEXT[] NOT NULL,
  cost INTEGER,
  attributes TEXT[] NOT NULL,
  power INTEGER,
  counter INTEGER,
  types TEXT[] NOT NULL,
  effect TEXT,
  trigger TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cards_card_id ON cards(card_id);
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_cards_pack_id ON cards(pack_id);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_category ON cards(category);
CREATE INDEX IF NOT EXISTS idx_cards_colors ON cards USING gin(colors);
CREATE INDEX IF NOT EXISTS idx_cards_types ON cards USING gin(types);

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE cards;

`;

  // Generate INSERT statements helper
  function generateInsertStatements(cardChunk, isLast) {
    const values = cardChunk.map((card, index) => {
      const values = [
        escapeSQL(card.id), // This becomes card_id in the database
        escapeSQL(card.pack_id),
        escapeSQL(card.name),
        escapeSQL(card.rarity),
        escapeSQL(card.category),
        escapeSQL(card.img_url),
        escapeSQL(card.img_full_url),
        arrayToSQL(card.colors || []),
        card.cost !== null && card.cost !== undefined ? card.cost : 'NULL',
        arrayToSQL(card.attributes || []),
        card.power !== null && card.power !== undefined ? card.power : 'NULL',
        card.counter !== null && card.counter !== undefined ? card.counter : 'NULL',
        arrayToSQL(card.types || []),
        card.effect ? escapeSQL(card.effect) : 'NULL',
        card.trigger ? escapeSQL(card.trigger) : 'NULL'
      ].join(', ');

      return `  (${values})${index < cardChunk.length - 1 ? ',' : ';'}`;
    });

    return values.join('\n');
  }

  // Generate and write each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkNum = i + 1;
    const isFirst = i === 0;
    const isLast = i === chunks.length - 1;
    
    let sql = '';
    
    if (isFirst) {
      // First chunk: include table creation
      sql = tableSQL;
    } else {
      // Other chunks: just header
      sql = `-- One Piece Card Game - Import Script (Part ${chunkNum} of ${numChunks})
-- Run this script after Part ${chunkNum - 1}

`;
    }
    
    sql += `-- Insert cards (chunk ${chunkNum} of ${numChunks} - ${chunk.length} cards)
INSERT INTO cards (card_id, pack_id, name, rarity, category, img_url, img_full_url, colors, cost, attributes, power, counter, types, effect, trigger)
VALUES
${generateInsertStatements(chunk, isLast)}
`;

    if (isLast) {
      // Last chunk: add verification queries
      sql += `\n-- Update statistics
ANALYZE cards;

-- Verify import
SELECT COUNT(*) as total_cards FROM cards;
SELECT pack_id, COUNT(*) as card_count FROM cards GROUP BY pack_id ORDER BY pack_id;
`;
    }

    const chunkFile = join(__dirname, `import-cards-part-${chunkNum}.sql`);
    await fs.writeFile(chunkFile, sql, 'utf-8');
    console.log(`✅ Generated: import-cards-part-${chunkNum}.sql (${chunk.length} cards)`);
  }

  console.log(`\n✅ Generated ${chunks.length} SQL files`);
  console.log(`   Total cards: ${cards.length}`);
  console.log(`\nNext steps:`);
  console.log(`1. Open your Supabase dashboard`);
  console.log(`2. Go to SQL Editor`);
  console.log(`3. Run the files in order:`);
  for (let i = 1; i <= chunks.length; i++) {
    console.log(`   ${i}. import-cards-part-${i}.sql`);
  }
}

generateSQL().catch(console.error);

