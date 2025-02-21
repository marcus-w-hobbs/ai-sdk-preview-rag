"use server";

import { db } from "../db";
import { generateEmbeddings } from "../ai/embedding";
import { sources, contentItems } from "@/lib/db/schema/content";
import { embeddings } from "@/lib/db/schema/embeddings";
import { eq, sql } from "drizzle-orm";

export const createResource = async (input: { content: string }) => {
  try {
    console.log('Creating resource with content:', input.content);
    
    // Create source record
    const [source] = await db
      .insert(sources)
      .values({
        name: "Chat Input",
        type: "markdown",
        metadata: {}
      })
      .returning();
    console.log('Created source:', source);

    // Create content item with initial processing status
    const [contentItem] = await db
      .insert(contentItems)
      .values({
        sourceId: source.id,
        title: "Chat Input",
        content: input.content,
        status: "processing"
      })
      .returning();
    console.log('Created content item:', contentItem);

    try {
      // Generate and store embeddings
      console.log('Generating embeddings...');
      const embeddingResults = await generateEmbeddings(input.content);
      console.log('Generated embeddings:', embeddingResults);
      
      console.log('Storing embeddings...');
      await db.insert(embeddings).values(
        embeddingResults.map((embedding) => ({
          contentId: contentItem.id,
          content: embedding.content,
          embedding: sql.raw(`'[${embedding.embedding.join(',')}]'::vector`),
        }))
      );
      console.log('Stored embeddings successfully');

      // Update content item status to completed only after embeddings are stored
      await db
        .update(contentItems)
        .set({ status: "completed" })
        .where(eq(contentItems.id, contentItem.id));

      return "Resource successfully created and embedded.";
    } catch (error) {
      // If embedding fails, update status to failed
      console.error('Failed to create embeddings:', error);
      await db
        .update(contentItems)
        .set({ 
          status: "failed",
          processingError: error instanceof Error ? error.message : "Unknown error"
        })
        .where(eq(contentItems.id, contentItem.id));
      throw error;
    }
  } catch (error) {
    console.error('Failed to create resource:', error);
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
