/**
 * Translate Oxford words to Russian using Lingva Translate API.
 * Uses cache to avoid re-translating already done words.
 * Cleans up bad translations from previous runs.
 *
 * Usage: npx tsx scripts/translate-words.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(import.meta.dirname, 'data')

// Public Lingva Translate instances (no API key needed, no daily limit)
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://lingva.lunar.icu',
  'https://translate.plausibility.cloud',
]

interface ProcessedWord {
  word: string
  part_of_speech: string
  level: string
  phonetics: string
  example: string
  translation: string
}

function isBadTranslation(word: string, translation: string): boolean {
  if (!translation) return true
  if (translation === word) return true
  if (translation.includes('mymemory warning')) return true
  if (translation.includes('mymemory')) return true
  if (translation.length > 100) return true // garbage long text
  if (translation.includes('<') || translation.includes('&')) return true // HTML artifacts
  return false
}

async function translateWord(word: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const instance = LINGVA_INSTANCES[attempt % LINGVA_INSTANCES.length]
    try {
      const url = `${instance}/api/v1/en/ru/${encodeURIComponent(word)}`
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) continue
      const data = await res.json()
      const translation = data?.translation
      if (translation && !isBadTranslation(word, translation)) {
        return translation.toLowerCase()
      }
    } catch {
      // try next instance
    }
    await sleep(200)
  }
  return word // fallback: keep original
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const allWords: ProcessedWord[] = JSON.parse(
    readFileSync(join(DATA_DIR, 'all-words.json'), 'utf-8')
  )

  console.log(`Total words: ${allWords.length}`)

  // Load cache
  const cachePath = join(DATA_DIR, 'translations-cache.json')
  let cache: Record<string, string> = {}
  try {
    cache = JSON.parse(readFileSync(cachePath, 'utf-8'))
    console.log(`Loaded ${Object.keys(cache).length} cached translations`)
  } catch {
    console.log('No cache found, starting fresh')
  }

  // Clean bad translations from cache
  let cleaned = 0
  for (const [word, tr] of Object.entries(cache)) {
    if (isBadTranslation(word, tr)) {
      delete cache[word]
      cleaned++
    }
  }
  if (cleaned > 0) console.log(`Cleaned ${cleaned} bad translations from cache`)

  // Find words needing translation
  const uniqueWords = [...new Set(allWords.map(w => w.word.toLowerCase()))]
  const needTranslation = uniqueWords.filter(w => !cache[w])

  console.log(`${uniqueWords.length - needTranslation.length} already translated`)
  console.log(`${needTranslation.length} words need translation\n`)

  // Translate
  for (let i = 0; i < needTranslation.length; i++) {
    const word = needTranslation[i]
    const translation = await translateWord(word)
    cache[word] = translation

    if (i % 50 === 0 || i === needTranslation.length - 1) {
      console.log(`  [${i + 1}/${needTranslation.length}] ${word} → ${translation}`)
      // Save cache periodically
      writeFileSync(cachePath, JSON.stringify(cache, null, 2))
    }

    // Small delay to be respectful
    await sleep(50)
  }

  // Final save
  writeFileSync(cachePath, JSON.stringify(cache, null, 2))
  console.log('\nCache saved')

  // Apply translations to set files
  const setFiles = readdirSync(DATA_DIR).filter(
    f => f.startsWith('oxford-') && f.endsWith('.json')
  )

  for (const filename of setFiles) {
    const filepath = join(DATA_DIR, filename)
    const words: ProcessedWord[] = JSON.parse(readFileSync(filepath, 'utf-8'))

    for (const word of words) {
      word.translation = cache[word.word.toLowerCase()] || word.word
    }

    writeFileSync(filepath, JSON.stringify(words, null, 2))
    console.log(`Updated ${filename}`)
  }

  // Update all-words.json
  for (const word of allWords) {
    word.translation = cache[word.word.toLowerCase()] || word.word
  }
  writeFileSync(join(DATA_DIR, 'all-words.json'), JSON.stringify(allWords, null, 2))

  // Stats
  let good = 0, bad = 0
  for (const w of uniqueWords) {
    if (cache[w] && !isBadTranslation(w, cache[w])) good++
    else bad++
  }
  console.log(`\nResult: ${good} translated, ${bad} untranslated`)
}

main().catch(console.error)
