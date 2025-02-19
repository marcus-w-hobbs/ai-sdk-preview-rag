"use server";

import { db } from "../db";
import { generateEmbeddings } from "../ai/embedding";
import { sources, contentItems } from "@/lib/db/schema/content";
import { embeddings } from "@/lib/db/schema/embeddings";
import { eq } from "drizzle-orm";

export const createResource = async (input: { content: string }) => {
  try {
    // Create source record
    const [source] = await db
      .insert(sources)
      .values({
        name: "Chat Input",
        type: "markdown",
        metadata: {}
      })
      .returning();

    // Create content item
    const [contentItem] = await db
      .insert(contentItems)
      .values({
        sourceId: source.id,
        title: "Chat Input",
        content: input.content,
        status: "processing"
      })
      .returning();

    // Generate and store embeddings
    const embeddingResults = await generateEmbeddings(input.content);
    await db.insert(embeddings).values(
      embeddingResults.map((embedding) => ({
        contentId: contentItem.id,
        ...embedding,
      }))
    );

    // Update content item status
    await db
      .update(contentItems)
      .set({ status: "completed" })
      .where(eq(contentItems.id, contentItem.id));

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
