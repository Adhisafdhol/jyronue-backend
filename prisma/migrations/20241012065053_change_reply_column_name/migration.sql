/*
  Warnings:

  - You are about to drop the column `replyId` on the `Reply` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_replyId_fkey";

-- AlterTable
ALTER TABLE "Reply" DROP COLUMN "replyId",
ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
