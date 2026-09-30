CREATE TYPE "DeletionAuditAction" AS ENUM (
  'SUBMISSION_DELETE',
  'BUILDING_SUBMISSIONS_DELETE'
);

CREATE TYPE "DeletionAuditActorType" AS ENUM (
  'ADMIN',
  'PUBLIC_CAPABILITY'
);

CREATE TABLE "DeletionAuditEvent" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "action" "DeletionAuditAction" NOT NULL,
  "actorType" "DeletionAuditActorType" NOT NULL,
  "actorUserId" TEXT,
  "actorRole" TEXT,
  "deletedCount" INTEGER NOT NULL,
  "receiptCommitment" TEXT NOT NULL,

  CONSTRAINT "DeletionAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DeletionAuditEvent_actor_check" CHECK (
    (
      "actorType" = 'ADMIN'
      AND "actorUserId" IS NOT NULL
      AND "actorRole" IS NOT NULL
    )
    OR
    (
      "actorType" = 'PUBLIC_CAPABILITY'
      AND "actorUserId" IS NULL
      AND "actorRole" IS NULL
    )
  ),
  CONSTRAINT "DeletionAuditEvent_deleted_count_check" CHECK ("deletedCount" > 0)
);

CREATE UNIQUE INDEX "DeletionAuditEvent_receiptCommitment_key"
ON "DeletionAuditEvent"("receiptCommitment");

CREATE INDEX "DeletionAuditEvent_createdAt_idx"
ON "DeletionAuditEvent"("createdAt");

CREATE INDEX "DeletionAuditEvent_actorUserId_createdAt_idx"
ON "DeletionAuditEvent"("actorUserId", "createdAt");

CREATE INDEX "DeletionAuditEvent_action_createdAt_idx"
ON "DeletionAuditEvent"("action", "createdAt");
