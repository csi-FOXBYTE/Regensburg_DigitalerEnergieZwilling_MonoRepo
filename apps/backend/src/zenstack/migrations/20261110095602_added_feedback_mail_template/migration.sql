-- CreateTable
CREATE TABLE "FeedbackMailTemplate" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" INTEGER NOT NULL DEFAULT 1,
    "html" TEXT NOT NULL,

    CONSTRAINT "FeedbackMailTemplate_pkey" PRIMARY KEY ("id"),
    -- The table holds at most one row, see schema.zmodel.
    CONSTRAINT "FeedbackMailTemplate_single_row" CHECK ("id" = 1)
);
