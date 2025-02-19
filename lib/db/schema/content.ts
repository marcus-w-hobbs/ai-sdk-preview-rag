import { sql } from "drizzle-orm"
import { text, varchar, timestamp, pgTable, jsonb, integer, boolean, pgEnum } from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { nanoid } from "@/lib/utils"

export const contentTypeEnum = pgEnum('content_type', ['pdf', 'markdown', 'url'])
export const processingStatusEnum = pgEnum('processing_status', ['pending', 'processing', 'completed', 'failed'])

export const categories = pgTable("categories", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
})

export const sources = pgTable("sources", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: varchar("name", { length: 255 }).notNull(),
  type: contentTypeEnum("type").notNull(),
  url: text("url"),
  metadata: jsonb("metadata").$type<{
    author?: string
    publishedDate?: string
    lastModified?: string
    fileSize?: number
    pageCount?: number
    [key: string]: any
  }>(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
})

export const contentItems = pgTable("content_items", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  sourceId: varchar("source_id", { length: 191 })
    .notNull()
    .references(() => sources.id),
  categoryId: varchar("category_id", { length: 191 })
    .references(() => categories.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  status: processingStatusEnum("status").notNull().default('pending'),
  processingError: text("processing_error"),
  chunkCount: integer("chunk_count"),
  isIndexed: boolean("is_indexed").notNull().default(false),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
})

// Schemas for validation
export const insertCategorySchema = createSelectSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const insertSourceSchema = createSelectSchema(sources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const insertContentItemSchema = createSelectSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isIndexed: true,
  chunkCount: true,
  processingError: true,
})

// Types for use in components and API routes
export type Category = typeof categories.$inferSelect
export type NewCategory = z.infer<typeof insertCategorySchema>

export type Source = typeof sources.$inferSelect
export type NewSource = z.infer<typeof insertSourceSchema>

export type ContentItem = typeof contentItems.$inferSelect
export type NewContentItem = z.infer<typeof insertContentItemSchema> 