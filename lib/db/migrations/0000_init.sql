-- Drop old tables if they exist
DROP TABLE IF EXISTS "embeddings";
DROP TABLE IF EXISTS "resources";

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enums
DO $$ BEGIN
  CREATE TYPE "content_type" AS ENUM ('pdf', 'markdown', 'url');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "processing_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS "categories" (
  "id" varchar(191) PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL UNIQUE,
  "description" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sources" (
  "id" varchar(191) PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "type" "content_type" NOT NULL,
  "url" text,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "content_items" (
  "id" varchar(191) PRIMARY KEY NOT NULL,
  "source_id" varchar(191) NOT NULL REFERENCES "sources" ("id"),
  "category_id" varchar(191) REFERENCES "categories" ("id"),
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "excerpt" text,
  "status" "processing_status" NOT NULL DEFAULT 'pending',
  "processing_error" text,
  "chunk_count" integer,
  "is_indexed" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "embeddings" (
  "id" varchar(191) PRIMARY KEY NOT NULL,
  "content_id" varchar(191) NOT NULL,
  "content" text NOT NULL,
  "embedding" vector(1536) NOT NULL,
  CONSTRAINT "embeddings_content_id_content_items_id_fk" 
    FOREIGN KEY ("content_id") REFERENCES "content_items"("id") 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "sources_type_idx" ON "sources" ("type");
CREATE INDEX IF NOT EXISTS "content_items_source_id_idx" ON "content_items" ("source_id");
CREATE INDEX IF NOT EXISTS "content_items_category_id_idx" ON "content_items" ("category_id");
CREATE INDEX IF NOT EXISTS "content_items_status_idx" ON "content_items" ("status");
CREATE INDEX IF NOT EXISTS "embedding_idx" ON "embeddings" USING ivfflat ("embedding" vector_cosine_ops); 