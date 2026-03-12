/**
 * Seed Supabase database with Oxford word sets.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.
 * Uses service_role key to bypass RLS.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-oxford.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(import.meta.dirname, 'data')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface ProcessedWord {
  word: string
  part_of_speech: string
  level: string
  phonetics: string
  example: string
  translation: string
}

const SETS = [
  { file: 'oxford-3000-a1.json', name: 'Oxford 3000 — A1', desc: 'Beginner vocabulary (A1)', level: 'A1', source: 'oxford3000' },
  { file: 'oxford-3000-a2.json', name: 'Oxford 3000 — A2', desc: 'Elementary vocabulary (A2)', level: 'A2', source: 'oxford3000' },
  { file: 'oxford-3000-b1.json', name: 'Oxford 3000 — B1', desc: 'Intermediate vocabulary (B1)', level: 'B1', source: 'oxford3000' },
  { file: 'oxford-3000-b2.json', name: 'Oxford 3000 — B2', desc: 'Upper-intermediate vocabulary (B2)', level: 'B2', source: 'oxford3000' },
  { file: 'oxford-5000-b2.json', name: 'Oxford 5000 — B2', desc: 'Advanced vocabulary (B2)', level: 'B2', source: 'oxford5000' },
  { file: 'oxford-5000-c1.json', name: 'Oxford 5000 — C1', desc: 'Proficiency vocabulary (C1)', level: 'C1', source: 'oxford5000' },
]

async function main() {
  console.log('Seeding Oxford word sets...\n')

  for (const setDef of SETS) {
    const filepath = join(DATA_DIR, setDef.file)
    let words: ProcessedWord[]
    try {
      words = JSON.parse(readFileSync(filepath, 'utf-8'))
    } catch {
      console.log(`  Skipping ${setDef.file} (file not found)`)
      continue
    }

    // Create the set
    const { data: setData, error: setError } = await supabase
      .from('sets')
      .insert({
        name: setDef.name,
        description: setDef.desc,
        cefr_level: setDef.level,
        source: setDef.source,
        card_count: words.length,
        is_system: true,
        owner_id: null,
      })
      .select('id')
      .single()

    if (setError) {
      console.error(`  Error creating set ${setDef.name}:`, setError.message)
      continue
    }

    console.log(`Created set: ${setDef.name} (${words.length} words)`)

    // Insert cards in batches of 200
    const batchSize = 200
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize).map(w => ({
        set_id: setData.id,
        front: w.word,
        back: w.translation || w.word,
        part_of_speech: w.part_of_speech || null,
        phonetics: w.phonetics || null,
        example: w.example || null,
        example_translation: w.example_translation || null,
      }))

      const { error } = await supabase.from('cards').insert(batch)
      if (error) {
        console.error(`  Error inserting batch at ${i}:`, error.message)
      }
    }

    console.log(`  Inserted ${words.length} cards\n`)
  }

  console.log('Seeding complete!')
}

main().catch(console.error)
