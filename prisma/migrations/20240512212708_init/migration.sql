-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "musicChannelId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);
