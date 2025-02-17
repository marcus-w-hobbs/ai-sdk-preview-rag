import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";
import { db } from "../db";

const embeddingModel = openai.embedding("text-embedding-ada-002");

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

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
