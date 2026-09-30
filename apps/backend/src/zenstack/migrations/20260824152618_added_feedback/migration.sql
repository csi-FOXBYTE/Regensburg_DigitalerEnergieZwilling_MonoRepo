-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('bug', 'feedback', 'suggestion');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "emailAddress" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_createdAt_id_idx" ON "Feedback"("createdAt", "id");

-- CreateIndex
CREATE INDEX "Feedback_category_id_idx" ON "Feedback"("category", "id");
