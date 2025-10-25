/*
  Warnings:

  - You are about to drop the column `coverImage` on the `books` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "books" DROP COLUMN "coverImage",
ADD COLUMN     "coverImageUrl" TEXT;
