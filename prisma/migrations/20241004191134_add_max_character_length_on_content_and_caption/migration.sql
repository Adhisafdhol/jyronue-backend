/*
  Warnings:

  - You are about to alter the column `content` on the `Comment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `caption` on the `Post` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `content` on the `Reply` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.

*/
-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "content" SET DATA TYPE VARCHAR(2048);

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "caption" SET DATA TYPE VARCHAR(2048);

-- AlterTable
ALTER TABLE "Reply" ALTER COLUMN "content" SET DATA TYPE VARCHAR(2048);
