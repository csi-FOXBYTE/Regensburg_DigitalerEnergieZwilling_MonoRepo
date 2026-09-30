-- CreateEnum
CREATE TYPE "BuildingDataSource" AS ENUM ('NONE', 'USER', 'ACTUAL');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'ASSIGNED', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "Building" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" TEXT NOT NULL,
    "address" TEXT,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "dataSource" "BuildingDataSource" NOT NULL DEFAULT 'NONE',

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletionToken" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "buildingId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "ngsiData" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "usedConfigId" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionChangeHistoryEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "from" "SubmissionStatus" NOT NULL,
    "to" "SubmissionStatus" NOT NULL,
    "byId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "SubmissionChangeHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_deletionToken_key" ON "Submission"("deletionToken");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- CreateIndex
CREATE INDEX "Submission_assignedToId_status_idx" ON "Submission"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "SubmissionChangeHistoryEntry_submissionId_idx" ON "SubmissionChangeHistoryEntry"("submissionId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_usedConfigId_fkey" FOREIGN KEY ("usedConfigId") REFERENCES "Config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionChangeHistoryEntry" ADD CONSTRAINT "SubmissionChangeHistoryEntry_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionChangeHistoryEntry" ADD CONSTRAINT "SubmissionChangeHistoryEntry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
