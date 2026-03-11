/**
 * Oxford 3000/5000 data preparation script.
 *
 * Downloads Oxford word lists from GitHub, parses, groups by CEFR level,
 * and outputs JSON seed files.
 *
 * Russian translations must be added separately (see translate step).
 *
 * Usage: npx tsx scripts/prepare-oxford-data.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(import.meta.dirname, 'data')
const SOURCE_URL = 'https://raw.githubusercontent.com/tyypgzl/Oxford-5000-words/main/full-word.json'

interface OxfordEntry {
  id: number
  value: {
    word: string
    href: string
    type: string
    level: string
    us: { mp3: string; ogg: string }
    uk: { mp3: string; ogg: string }
    phonetics?: {
      us?: string
      uk?: string
    }
    examples?: string[]
  }
}

interface ProcessedWord {
  word: string
  part_of_speech: string
  level: string
  phonetics: string
  example: string
  translation: string // To be filled
}

// Oxford 3000 = A1, A2, B1 (and some B2)
// Oxford 5000 = additional B2 + C1
const OXFORD_3000_LEVELS = ['A1', 'A2', 'B1']
const OXFORD_5000_EXTRA_LEVELS = ['B2', 'C1']

async function main() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  console.log('Fetching Oxford word data...')
  const res = await fetch(SOURCE_URL)
  const raw: OxfordEntry[] = await res.json()
  console.log(`Got ${raw.length} entries`)

  // Process entries
  const words: ProcessedWord[] = raw.map(entry => ({
    word: entry.value.word,
    part_of_speech: entry.value.type || '',
    level: entry.value.level?.toUpperCase().trim() || 'B2',
    phonetics: entry.value.phonetics?.us || '',
    example: entry.value.examples?.[0] || '',
    translation: '', // placeholder
  }))

  // Deduplicate: keep first occurrence of each word+POS combo
  const seen = new Set<string>()
  const unique = words.filter(w => {
    const key = `${w.word.toLowerCase()}|${w.part_of_speech}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`${unique.length} unique words after dedup`)

  // Group by level
  const byLevel: Record<string, ProcessedWord[]> = {}
  for (const w of unique) {
    const lvl = w.level
    if (!byLevel[lvl]) byLevel[lvl] = []
    byLevel[lvl].push(w)
  }

  for (const [level, words] of Object.entries(byLevel)) {
    console.log(`  ${level}: ${words.length} words`)
  }

  // Create set files
  // Oxford 3000 sets
  for (const level of OXFORD_3000_LEVELS) {
    const setWords = byLevel[level] || []
    const filename = `oxford-3000-${level.toLowerCase()}.json`
    writeFileSync(join(DATA_DIR, filename), JSON.stringify(setWords, null, 2))
    console.log(`Written ${filename} (${setWords.length} words)`)
  }

  // Oxford 3000 B2 = the B2 words that are part of the 3000
  // Oxford 5000 B2 = additional B2 words for 5000
  // Since the source doesn't clearly separate them, we split B2 roughly:
  // first ~600 B2 go to Oxford 3000, rest to Oxford 5000
  const b2Words = byLevel['B2'] || []
  const oxford3000B2 = b2Words.slice(0, Math.floor(b2Words.length * 0.4))
  const oxford5000B2 = b2Words.slice(Math.floor(b2Words.length * 0.4))

  writeFileSync(join(DATA_DIR, 'oxford-3000-b2.json'), JSON.stringify(oxford3000B2, null, 2))
  console.log(`Written oxford-3000-b2.json (${oxford3000B2.length} words)`)

  writeFileSync(join(DATA_DIR, 'oxford-5000-b2.json'), JSON.stringify(oxford5000B2, null, 2))
  console.log(`Written oxford-5000-b2.json (${oxford5000B2.length} words)`)

  // Oxford 5000 C1
  const c1Words = byLevel['C1'] || []
  writeFileSync(join(DATA_DIR, 'oxford-5000-c1.json'), JSON.stringify(c1Words, null, 2))
  console.log(`Written oxford-5000-c1.json (${c1Words.length} words)`)

  // Also save all words as a single file for translation
  writeFileSync(join(DATA_DIR, 'all-words.json'), JSON.stringify(unique, null, 2))
  console.log(`\nTotal: ${unique.length} words saved to all-words.json`)
  console.log('\nNext step: run translate script to add Russian translations')
}

main().catch(console.error)
