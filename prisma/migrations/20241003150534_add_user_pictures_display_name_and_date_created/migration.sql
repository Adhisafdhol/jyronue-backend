-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" VARCHAR(255),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "displayName" VARCHAR(32);

-- CreateTable
CREATE TABLE "profileImage" (
    "id" TEXT NOT NULL,
    "bannerUrl" TEXT NOT NULL,
    "pictureUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "profileImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profileImage_userId_key" ON "profileImage"("userId");

-- AddForeignKey
ALTER TABLE "profileImage" ADD CONSTRAINT "profileImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
