/*
  Warnings:

  - Added the required column `body` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "read_at" TIMESTAMP(3),
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "entity_type" DROP NOT NULL,
ALTER COLUMN "entity_id" DROP NOT NULL;
