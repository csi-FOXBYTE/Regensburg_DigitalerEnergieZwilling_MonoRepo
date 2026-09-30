-- Do not choose a legacy winner implicitly. Resolve conflicting accepted
-- submissions with the responsible department before applying this migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Submission"
    WHERE "status" = 'ACCEPTED'
    GROUP BY "buildingId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Migration aborted: multiple accepted submissions exist for at least one building';
  END IF;
END $$;

-- Add the terminal state for a formerly accepted submission that was replaced
-- by a newer accepted submission for the same building.
ALTER TYPE "SubmissionStatus" ADD VALUE 'SUPERSEDED';

-- Persist manual review comments and references created by automatic status
-- transitions.
ALTER TABLE "SubmissionChangeHistoryEntry"
ADD COLUMN "comment" TEXT,
ADD COLUMN "relatedSubmissionId" TEXT;

-- Submission history belongs to its submission and must not prevent the
-- explicit physical deletion of that submission.
ALTER TABLE "SubmissionChangeHistoryEntry"
DROP CONSTRAINT "SubmissionChangeHistoryEntry_submissionId_fkey";

ALTER TABLE "SubmissionChangeHistoryEntry"
ADD CONSTRAINT "SubmissionChangeHistoryEntry_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "Submission"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep the invariant enforced after the migration.
CREATE UNIQUE INDEX "Submission_one_accepted_per_building_idx"
ON "Submission"("buildingId")
WHERE "status" = 'ACCEPTED';
