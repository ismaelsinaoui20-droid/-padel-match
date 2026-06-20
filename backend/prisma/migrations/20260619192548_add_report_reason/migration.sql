/*
  Warnings:

  - Added the required column `reason` to the `PlayerReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlayerReport" ADD COLUMN     "reason" TEXT NOT NULL;
