-- AlterTable
ALTER TABLE "GameState" ADD COLUMN "autoGatherSessionGains" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "GameState" ADD COLUMN "pendingAutoGatherSummary" JSONB;
ALTER TABLE "GameState" ADD COLUMN "dailyBonusLastClaimAt" TIMESTAMP(3);
ALTER TABLE "GameState" ADD COLUMN "dailyBonusStreak" INTEGER NOT NULL DEFAULT 0;
