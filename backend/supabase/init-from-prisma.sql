-- Generated-compatible SQL for Bayada (use `pnpm prisma migrate dev` preferably)

CREATE TYPE "AppRole" AS ENUM ('user', 'contributor', 'admin');
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "PlaceCategory" AS ENUM (
  'mohini_sighting',
  'colonial_bungalow',
  'haunted_junction',
  'cemetery',
  'folklore_curse',
  'abandoned_building',
  'other'
);
CREATE TYPE "MediaType" AS ENUM ('image', 'youtube');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "google_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "display_name" TEXT,
  "avatar_url" TEXT,
  "role" "AppRole" NOT NULL DEFAULT 'user',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE TABLE "haunted_places" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "PlaceCategory" NOT NULL,
  "spookiness_rating" INTEGER NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "nearest_city" TEXT NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
  "rejection_reason" TEXT,
  "created_by" UUID,
  "reviewed_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "haunted_places_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "haunted_places_status_idx" ON "haunted_places"("status");
CREATE INDEX "haunted_places_created_by_idx" ON "haunted_places"("created_by");

CREATE TABLE "evidence_media" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "place_id" UUID NOT NULL,
  "media_type" "MediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "youtube_id" TEXT,
  "uploaded_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evidence_media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "place_visits" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "place_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "check_in_lat" DOUBLE PRECISION NOT NULL,
  "check_in_lng" DOUBLE PRECISION NOT NULL,
  "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "place_visits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "place_visits_place_id_user_id_key" ON "place_visits"("place_id", "user_id");
CREATE INDEX "place_visits_user_id_idx" ON "place_visits"("user_id");
CREATE INDEX "place_visits_place_id_idx" ON "place_visits"("place_id");

ALTER TABLE "haunted_places"
  ADD CONSTRAINT "haunted_places_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "haunted_places"
  ADD CONSTRAINT "haunted_places_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "evidence_media"
  ADD CONSTRAINT "evidence_media_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "haunted_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evidence_media"
  ADD CONSTRAINT "evidence_media_uploaded_by_fkey"
  FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "place_visits"
  ADD CONSTRAINT "place_visits_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "haunted_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "place_visits"
  ADD CONSTRAINT "place_visits_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
