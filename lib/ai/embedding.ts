import { OpenAI } from "openai"
import { desc, gt, sql } from "drizzle-orm"
import { embeddings } from "../db/schema/embeddings"
import { db } from "../db"
import { env } from "@/lib/env.mjs"

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000,
})

const MIN_CHUNK_LENGTH = 3
const MIN_WORDS_PER_CHUNK = 5
const MAX_WORDS_PER_CHUNK = 50

// Common abbreviations that shouldn't break sentences
const COMMON_ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof',
  'inc', 'ltd', 'co', 'corp',
  'vs', 'etc', 'ie', 'eg',
  'am', 'pm',
  'u.s', 'u.s.a', 'u.k',
  'a.i', 'a.m', 'p.m'
])

// Pre-process text to protect special cases
function protectSpecialCases(text: string): string {
  // Replace common multi-part abbreviations with temporary tokens
  return text
    .replace(/U\.S\.A\./gi, '__USA__')
    .replace(/U\.S\./gi, '__US__')
    .replace(/A\.I\./gi, '__AI__')
    .replace(/(\d+)(?:\s*)([AaPp]\.M\.)/g, '$1__$2__') // Handle times
    .replace(/([A-Z][a-z]{1,2}\.)(?:\s+)([A-Z][a-zA-Z]+)/g, '$1__NAME__$2') // Protect titles with names
}

// Post-process text to restore special cases
function restoreSpecialCases(text: string): string {
  return text
    .replace(/__USA__/g, 'U.S.A.')
    .replace(/__US__/g, 'U.S.')
    .replace(/__AI__/g, 'A.I.')
    .replace(/__([AaPp]\.M\.)__/g, ' $1')
    .replace(/__NAME__/g, ' ')
}

function isAbbreviation(word: string): boolean {
  return COMMON_ABBREVIATIONS.has(word.toLowerCase().replace(/\./g, ''))
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

const generateChunks = (input: string): string[] => {
  // Pre-process to protect special cases
  const processedInput = protectSpecialCases(input)
  
  // Split into sentences, being careful with delimiters
  const sentences = processedInput
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length >= MIN_CHUNK_LENGTH)
  
  const chunks: string[] = []
  let currentChunk = ''
  
  for (const sentence of sentences) {
    const potentialChunk = currentChunk 
      ? currentChunk + ' ' + sentence 
      : sentence
    
    const wordCount = countWords(potentialChunk)
    
    if (wordCount >= MIN_WORDS_PER_CHUNK) {
      if (wordCount <= MAX_WORDS_PER_CHUNK) {
        // If it's a good size, add it
        chunks.push(restoreSpecialCases(potentialChunk.trim()))
        currentChunk = ''
      } else {
        // If too large, add the current chunk and start new one
        if (currentChunk) {
          chunks.push(restoreSpecialCases(currentChunk.trim()))
        }
        currentChunk = sentence
      }
    } else {
      currentChunk = potentialChunk
    }
  }
  
  // Add any remaining content if it meets minimum requirements
  if (currentChunk && countWords(currentChunk) >= MIN_WORDS_PER_CHUNK) {
    chunks.push(restoreSpecialCases(currentChunk.trim()))
  } else if (currentChunk && chunks.length > 0) {
    // Append short remaining content to the last chunk if possible
    const lastChunk = chunks[chunks.length - 1]
    const combined = lastChunk + ' ' + currentChunk
    if (countWords(combined) <= MAX_WORDS_PER_CHUNK) {
      chunks[chunks.length - 1] = restoreSpecialCases(combined.trim())
    }
  }
  
  return chunks
}

const BATCH_SIZE = 25 // Reduced from 100 to 25
const MIN_BACKOFF = 1000 // 1 second
const MAX_BACKOFF = 300000 // 5 minutes
const REQUEST_DELAY = 50 // 50ms between requests

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getBackoffTime(retryCount: number): Promise<number> {
  const backoff = Math.min(
    MAX_BACKOFF,
    MIN_BACKOFF * Math.pow(2, retryCount)
  )
  // Add jitter
  return backoff * (0.75 + Math.random() * 0.5)
}

async function processBatch(chunks: string[], startIdx: number): Promise<Array<{ embedding: number[]; content: string }>> {
  const batch = chunks.slice(startIdx, startIdx + BATCH_SIZE)
  console.warn(`🔄 Processing batch starting at ${startIdx}, size: ${batch.length}`)
  
  const results = []
  for (let i = 0; i < batch.length; i++) {
    let retryCount = 0
    while (true) {
      try {
        console.warn(`📊 Processing chunk ${startIdx + i + 1}/${chunks.length}`)
        const response = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: batch[i],
        })
        results.push({
          content: batch[i],
          embedding: response.data[0].embedding,
        })
        break // Success, exit retry loop
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('rate limit')) {
            retryCount++
            const backoff = await getBackoffTime(retryCount)
            console.warn(`⏳ Rate limit hit, backing off for ${Math.round(backoff/1000)}s (attempt ${retryCount})...`)
            await sleep(backoff)
            continue // Retry after backoff
          }
        }
        throw error // Non-rate-limit error, rethrow
      }
    }
    // Delay between successful requests
    await sleep(REQUEST_DELAY)
  }
  return results
}

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value)
  console.warn('🔄 Generating embeddings for chunks:', { count: chunks.length })
  
  try {
    const allResults = []
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchResults = await processBatch(chunks, i)
      allResults.push(...batchResults)
      // Add a larger delay between batches
      if (i + BATCH_SIZE < chunks.length) {
        console.warn('😴 Pausing between batches...')
        await sleep(2000) // 2 second delay between batches
      }
    }
    
    console.warn('✅ Successfully generated embeddings for all chunks')
    return allResults
  } catch (error) {
    console.error('❌ Embedding generation failed:', error)
    throw error
  }
}

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\n", " ")
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('❌ Single embedding generation failed:', error)
    if (error instanceof Error) {
      if (error.message.includes('EADDRNOTAVAIL')) {
        throw new Error('Failed to connect to OpenAI API. Please check your network connection and API key.')
      }
      if (error.message.includes('rate limit')) {
        throw new Error('OpenAI API rate limit reached. Please try again in a few minutes.')
      }
    }
    throw error
  }
}

export const findRelevantContent = async (userQuery: string) => {
  // Convert user's question into a vector
  const userQueryEmbedded = await generateEmbedding(userQuery)

  // Calculate cosine similarity using the vector_cosine_ops operator
  const similarity = sql<number>`1 - (${embeddings.embedding} <=> ${sql`array[${userQueryEmbedded}]::float4[]`})`

  // Query the database
  const similarGuides = await db
    .select({ 
      name: embeddings.content,    // Get the text content
      similarity                   // Get the similarity score
    })
    .from(embeddings)
    .where(gt(similarity, 0.3))    // Only return results with >30% similarity
    .orderBy((t) => desc(t.similarity))  // Most similar first
    .limit(4)                     // Get top 4 results

  return similarGuides
}
