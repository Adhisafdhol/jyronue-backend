-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_replyId_fkey";

-- AlterTable
ALTER TABLE "Reply" ALTER COLUMN "replyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
