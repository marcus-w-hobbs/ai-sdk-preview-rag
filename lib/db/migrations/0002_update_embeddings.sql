DROP TABLE IF EXISTS "embeddings";
DROP TABLE IF EXISTS "resources";

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

CREATE INDEX IF NOT EXISTS "embedding_idx" ON "embeddings" USING ivfflat ("embedding" vector_cosine_ops); 