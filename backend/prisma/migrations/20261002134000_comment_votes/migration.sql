-- CreateEnum
CREATE TYPE "CommentVoteType" AS ENUM ('up', 'down');

-- CreateTable
CREATE TABLE "comment_votes" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "CommentVoteType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("id")
);

-- Migrate existing upvotes
INSERT INTO "comment_votes" ("id", "comment_id", "user_id", "type", "created_at", "updated_at")
SELECT "id", "comment_id", "user_id", 'up'::"CommentVoteType", "created_at", "created_at"
FROM "comment_upvotes";

-- DropTable
DROP TABLE "comment_upvotes";

-- CreateIndex
CREATE UNIQUE INDEX "comment_votes_comment_id_user_id_key" ON "comment_votes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "comment_votes_comment_id_idx" ON "comment_votes"("comment_id");

-- CreateIndex
CREATE INDEX "comment_votes_user_id_idx" ON "comment_votes"("user_id");

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "place_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
