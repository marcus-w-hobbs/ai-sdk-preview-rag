import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";
import { db } from "../db";

const embeddingModel = openai.embedding("text-embedding-ada-002");

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

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  // Convert user's question into a vector
  const userQueryEmbedded = await generateEmbedding(userQuery);

  // Calculate cosine similarity between query vector and all stored vectors
  // 1 - cosineDistance gives us similarity score (1 = identical, 0 = unrelated)
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding, 
    userQueryEmbedded
  )})`;

  // Query the database
  const similarGuides = await db
    .select({ 
      name: embeddings.content,    // Get the text content
      similarity                   // Get the similarity score
    })
    .from(embeddings)
    .where(gt(similarity, 0.3))    // Only return results with >30% similarity
    .orderBy((t) => desc(t.similarity))  // Most similar first
    .limit(4);                     // Get top 4 results

  return similarGuides;
};
