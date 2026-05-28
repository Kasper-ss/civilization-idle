-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "photoUrl" TEXT,
    "civilizationName" TEXT NOT NULL DEFAULT 'My Civilization',
    "referrerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "era" INTEGER NOT NULL DEFAULT 0,
    "totalXP" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "population" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "gems" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resources" JSONB NOT NULL,
    "buildings" JSONB NOT NULL,
    "researches" JSONB NOT NULL,
    "wondersBuilt" JSONB NOT NULL DEFAULT '[]',
    "activeWonder" JSONB,
    "territories" JSONB NOT NULL DEFAULT '[]',
    "endgameProjects" JSONB NOT NULL DEFAULT '{}',
    "vipTier" TEXT,
    "vipExpiresAt" TIMESTAMP(3),
    "productionMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "boostExpiresAt" TIMESTAMP(3),
    "eraProductionBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scienceBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "civilizationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalResourcesProduced" JSONB NOT NULL DEFAULT '{}',
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOfflineCollect" TIMESTAMP(3),
    "dailySpinUsedAt" TIMESTAMP(3),
    "battlePass" JSONB NOT NULL DEFAULT '{}',
    "cosmetics" JSONB NOT NULL DEFAULT '{}',
    "title" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "daysPlayed" INTEGER NOT NULL DEFAULT 1,
    "firstPlayDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "starsAmount" INTEGER NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "era" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "wonders" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "GameState_userId_key" ON "GameState"("userId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_score_idx" ON "LeaderboardSnapshot"("score" DESC);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameState" ADD CONSTRAINT "GameState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
