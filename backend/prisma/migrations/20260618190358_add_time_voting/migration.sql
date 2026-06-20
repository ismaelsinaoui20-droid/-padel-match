-- AlterEnum
ALTER TYPE "GroupStatus" ADD VALUE 'CONFIRMED';

-- AlterTable
ALTER TABLE "MatchGroup" ADD COLUMN     "confirmedTime" TEXT;

-- CreateTable
CREATE TABLE "TimeVote" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeVote_groupId_userId_key" ON "TimeVote"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "TimeVote" ADD CONSTRAINT "TimeVote_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MatchGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeVote" ADD CONSTRAINT "TimeVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
