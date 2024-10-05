/*
  Warnings:

  - Added the required column `replyToId` to the `Reply` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "replyToId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
