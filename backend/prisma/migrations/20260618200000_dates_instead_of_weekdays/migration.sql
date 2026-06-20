-- Drop weekday-based columns and replace with calendar-date strings (2-week cycle).
ALTER TABLE "MatchGroup" DROP COLUMN "day";
ALTER TABLE "MatchGroup" ADD COLUMN "date" TEXT NOT NULL;

ALTER TABLE "User" DROP COLUMN "availableDays";
ALTER TABLE "User" ADD COLUMN "availableDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ALTER COLUMN "availableDates" DROP DEFAULT;

DROP TYPE "Day";
