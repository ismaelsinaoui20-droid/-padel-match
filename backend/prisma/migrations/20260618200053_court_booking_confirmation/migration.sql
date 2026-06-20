-- AlterTable
ALTER TABLE "MatchGroup" ADD COLUMN     "courtBooked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CourtBookingVote" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourtBookingVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourtBookingVote_groupId_userId_key" ON "CourtBookingVote"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "CourtBookingVote" ADD CONSTRAINT "CourtBookingVote_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MatchGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtBookingVote" ADD CONSTRAINT "CourtBookingVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
