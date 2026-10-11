-- Add JSONB features column for model-free image features (phash + color histogram).
-- The existing `embedding` vector(512) column is kept nullable for backward
-- compatibility but is no longer populated by the phash-color feature pipeline.

ALTER TABLE "product_image_embeddings"
  ADD COLUMN IF NOT EXISTS "features" JSONB;

CREATE INDEX IF NOT EXISTS "product_image_embeddings_features_status_idx"
  ON "product_image_embeddings" ("status", "model_version")
  WHERE "features" IS NOT NULL;
