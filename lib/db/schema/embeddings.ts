import { nanoid } from "@/lib/utils";
import { index, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { pgvector } from "@/lib/db/extensions";
import { contentItems } from "./content";

export const embeddings = pgTable(
  "embeddings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    contentId: varchar("content_id", { length: 191 })
      .references(() => contentItems.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    embedding: pgvector("embedding", { dimensions: 1536 }).notNull(),
  },
  (table) => ({
    embeddingIndex: index("embedding_idx").on(table.embedding),
  }),
);
