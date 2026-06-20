/*
  Warnings:

  - Added the required column `day` to the `MatchGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MatchGroup" ADD COLUMN     "day" "Day" NOT NULL;
