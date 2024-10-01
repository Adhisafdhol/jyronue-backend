/*
  Warnings:

  - You are about to drop the column `likes` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Reply` table. All the data in the column will be lost.
  - Added the required column `content` to the `Reply` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LikesBoxType" AS ENUM ('COMMENT', 'POST', 'REPLY');

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "likes";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "likes";

-- AlterTable
ALTER TABLE "Reply" DROP COLUMN "likes",
ADD COLUMN     "content" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "authorid" TEXT NOT NULL,
    "likesBoxId" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LikesBox" (
    "id" TEXT NOT NULL,
    "type" "LikesBoxType" NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "replyId" TEXT,

    CONSTRAINT "LikesBox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LikesBox_postId_key" ON "LikesBox"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "LikesBox_commentId_key" ON "LikesBox"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "LikesBox_replyId_key" ON "LikesBox"("replyId");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_authorid_fkey" FOREIGN KEY ("authorid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_likesBoxId_fkey" FOREIGN KEY ("likesBoxId") REFERENCES "LikesBox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikesBox" ADD CONSTRAINT "LikesBox_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikesBox" ADD CONSTRAINT "LikesBox_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikesBox" ADD CONSTRAINT "LikesBox_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
