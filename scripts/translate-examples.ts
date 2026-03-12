/**
 * Translate Oxford word translations and example sentences using Claude API.
 * Sends batches of ~80 words per request for efficiency.
 * Uses cache to avoid re-translating.
 *
 * Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/translate-examples.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(import.meta.dirname, 'data')
const BATCH_SIZE = 80

interface ProcessedWord {
  word: string
  part_of_speech: string
  level: string
  phonetics: string
  example: string
  translation: string
  example_translation?: string
}

interface TranslationResult {
  word: string
  translation: string
  example_translation: string
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function translateBatch(
  client: Anthropic,
  words: ProcessedWord[],
): Promise<TranslationResult[]> {
  const items = words.map((w, i) =>
    `${i + 1}. "${w.word}" (${w.part_of_speech}) — example: "${w.example || ''}"`
  ).join('\n')

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Translate these English words and their example sentences to Russian. For each word, provide:
1. The best Russian translation (concise, commonly used equivalent for this part of speech)
2. Russian translation of the example sentence (natural, not literal)

Return ONLY a JSON array in this exact format, no other text:
[{"word":"...", "translation":"...", "example_translation":"..."}]

Words to translate:
${items}`
    }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()

  // Extract JSON from response (might have markdown code block)
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error('Failed to parse response:', text.slice(0, 200))
    return []
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    console.error('JSON parse error:', text.slice(0, 200))
    return []
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY environment variable')
    console.error('Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/translate-examples.ts')
    process.exit(1)
  }

  const client = new Anthropic()

  // Load caches
  const wordCachePath = join(DATA_DIR, 'translations-cache-claude.json')
  const exampleCachePath = join(DATA_DIR, 'example-translations-cache.json')

  let wordCache: Record<string, string> = {}
  let exampleCache: Record<string, string> = {}

  try {
    wordCache = JSON.parse(readFileSync(wordCachePath, 'utf-8'))
    console.log(`Loaded ${Object.keys(wordCache).length} cached word translations`)
  } catch {
    console.log('No word translation cache found')
  }

  try {
    exampleCache = JSON.parse(readFileSync(exampleCachePath, 'utf-8'))
    console.log(`Loaded ${Object.keys(exampleCache).length} cached example translations`)
  } catch {
    console.log('No example translation cache found')
  }

  // Process each set file
  const setFiles = readdirSync(DATA_DIR).filter(
    f => f.startsWith('oxford-') && f.endsWith('.json')
  )

  for (const filename of setFiles) {
    const filepath = join(DATA_DIR, filename)
    const words: ProcessedWord[] = JSON.parse(readFileSync(filepath, 'utf-8'))

    console.log(`\n--- ${filename} (${words.length} words) ---`)

    // Find words needing translation
    const needWork = words.filter(w => {
      const key = `${w.word}|${w.part_of_speech}`
      const hasWordTr = wordCache[key]
      const hasExTr = !w.example || exampleCache[w.example]
      return !hasWordTr || !hasExTr
    })

    console.log(`  ${needWork.length} words need translation`)

    // Process in batches
    for (let i = 0; i < needWork.length; i += BATCH_SIZE) {
      const batch = needWork.slice(i, i + BATCH_SIZE)
      const results = await translateBatch(client, batch)

      // Apply results to caches
      for (let j = 0; j < results.length && j < batch.length; j++) {
        const r = results[j]
        const w = batch[j]
        const key = `${w.word}|${w.part_of_speech}`

        if (r.translation) {
          wordCache[key] = r.translation
        }
        if (r.example_translation && w.example) {
          exampleCache[w.example] = r.example_translation
        }
      }

      const done = Math.min(i + BATCH_SIZE, needWork.length)
      console.log(`  [${done}/${needWork.length}] translated`)

      // Save caches periodically
      writeFileSync(wordCachePath, JSON.stringify(wordCache, null, 2))
      writeFileSync(exampleCachePath, JSON.stringify(exampleCache, null, 2))

      // Small delay to respect rate limits
      if (i + BATCH_SIZE < needWork.length) {
        await sleep(500)
      }
    }

    // Apply translations to the file
    for (const word of words) {
      const key = `${word.word}|${word.part_of_speech}`
      if (wordCache[key]) {
        word.translation = wordCache[key]
      }
      if (word.example && exampleCache[word.example]) {
        word.example_translation = exampleCache[word.example]
      }
    }

    writeFileSync(filepath, JSON.stringify(words, null, 2))
    console.log(`  Saved ${filename}`)
  }

  // Update all-words.json
  const allWordsPath = join(DATA_DIR, 'all-words.json')
  try {
    const allWords: ProcessedWord[] = JSON.parse(readFileSync(allWordsPath, 'utf-8'))
    for (const word of allWords) {
      const key = `${word.word}|${word.part_of_speech}`
      if (wordCache[key]) {
        word.translation = wordCache[key]
      }
      if (word.example && exampleCache[word.example]) {
        word.example_translation = exampleCache[word.example]
      }
    }
    writeFileSync(allWordsPath, JSON.stringify(allWords, null, 2))
    console.log('\nUpdated all-words.json')
  } catch {
    console.log('\nSkipped all-words.json (not found)')
  }

  console.log('\nDone! All translations saved.')
}

main().catch(console.error)
