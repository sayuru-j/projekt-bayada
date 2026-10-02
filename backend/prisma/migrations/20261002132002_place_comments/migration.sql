-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "place_comments" (
    "id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body" VARCHAR(280) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_upvotes" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_upvotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_comments_place_id_idx" ON "place_comments"("place_id");

-- CreateIndex
CREATE INDEX "place_comments_user_id_idx" ON "place_comments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "place_comments_place_id_user_id_key" ON "place_comments"("place_id", "user_id");

-- CreateIndex
CREATE INDEX "comment_upvotes_comment_id_idx" ON "comment_upvotes"("comment_id");

-- CreateIndex
CREATE INDEX "comment_upvotes_user_id_idx" ON "comment_upvotes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_upvotes_comment_id_user_id_key" ON "comment_upvotes"("comment_id", "user_id");

-- AddForeignKey
ALTER TABLE "place_comments" ADD CONSTRAINT "place_comments_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "haunted_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_comments" ADD CONSTRAINT "place_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_upvotes" ADD CONSTRAINT "comment_upvotes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "place_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_upvotes" ADD CONSTRAINT "comment_upvotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
