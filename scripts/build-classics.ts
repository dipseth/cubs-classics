#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'fs'
import { load } from 'js-yaml'

interface ClassicEntry {
  url: string
  title: string
}

interface ClassicsFile {
  classics: ClassicEntry[]
}

/** Extract YouTube video ID from any URL format or bare ID */
function extractVideoId(input: string): string {
  const trimmed = input.trim()

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  // youtube.com/watch?v=ID
  const longMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (longMatch) return longMatch[1]

  // youtube.com/embed/ID
  const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]

  // Bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  throw new Error(`Cannot extract video ID from: ${input}`)
}

const raw = readFileSync('classics.yaml', 'utf-8')
const data = load(raw) as ClassicsFile

const classics = data.classics.map((entry) => ({
  videoId: extractVideoId(entry.url),
  title: entry.title,
}))

writeFileSync('src/classics.json', JSON.stringify(classics, null, 2) + '\n')
console.log(`Generated src/classics.json with ${classics.length} classics`)
