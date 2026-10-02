-- Dynamic categories: migrate from PlaceCategory enum to categories table

CREATE TABLE IF NOT EXISTS "categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "name_en" TEXT NOT NULL,
  "name_si" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#a3a3a3',
  "icon" TEXT NOT NULL DEFAULT 'MapPin',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key" ON "categories"("slug");

INSERT INTO "categories" ("id", "slug", "name_en", "name_si", "color", "icon", "sort_order", "updated_at")
VALUES
  (gen_random_uuid(), 'mohini_sighting', 'Mohini sighting', 'මෝහිනී දර්ශනය', '#f472b6', 'Ghost', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'colonial_bungalow', 'Colonial bungalow', 'යටත්විජිත බංගලාව', '#fbbf24', 'House', 2, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'haunted_junction', 'Haunted junction', 'භූත හන්දිය', '#60a5fa', 'Signpost', 3, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'cemetery', 'Cemetery', 'සුසාන භූමිය', '#ededed', 'Skull', 4, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'folklore_curse', 'Folklore curse', 'ජනකතා ශාපය', '#c084fc', 'Moon', 5, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'abandoned_building', 'Abandoned building', 'අත්හැරි ගොඩනැගිල්ල', '#fb923c', 'Building2', 6, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'other', 'Other', 'වෙනත්', '#a3a3a3', 'MapPin', 99, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "haunted_places" ADD COLUMN IF NOT EXISTS "category_id" UUID;

UPDATE "haunted_places" hp
SET "category_id" = c."id"
FROM "categories" c
WHERE hp."category_id" IS NULL
  AND hp."category"::text = c."slug";

UPDATE "haunted_places" hp
SET "category_id" = c."id"
FROM "categories" c
WHERE hp."category_id" IS NULL
  AND c."slug" = 'other';

ALTER TABLE "haunted_places" ALTER COLUMN "category_id" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "haunted_places"
    ADD CONSTRAINT "haunted_places_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "haunted_places_category_id_idx" ON "haunted_places"("category_id");

ALTER TABLE "haunted_places" DROP COLUMN IF EXISTS "category";

DROP TYPE IF EXISTS "PlaceCategory";
