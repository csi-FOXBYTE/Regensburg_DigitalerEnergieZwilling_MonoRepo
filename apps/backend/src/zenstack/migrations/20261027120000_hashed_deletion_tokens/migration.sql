-- Store only a SHA-256 hash of the public deletion token. The hash is derived
-- in place from the existing plaintext so that deletion links already handed
-- out keep working; the backend hashes the presented token the same way
-- (UTF-8 bytes, lowercase hex).
ALTER TABLE "Submission" ADD COLUMN "deletionTokenHash" TEXT;
ALTER TABLE "Submission" ADD COLUMN "deletionTokenExpiresAt" TIMESTAMP(3);

UPDATE "Submission"
SET "deletionTokenHash" = encode(sha256(convert_to("deletionToken", 'UTF8')), 'hex');

ALTER TABLE "Submission" ALTER COLUMN "deletionTokenHash" SET NOT NULL;

-- Existing submissions keep a token without expiry (NULL). Their links were
-- issued without an announced deadline, see the privacy notice.
DROP INDEX "Submission_deletionToken_key";
ALTER TABLE "Submission" DROP COLUMN "deletionToken";

CREATE UNIQUE INDEX "Submission_deletionTokenHash_key" ON "Submission"("deletionTokenHash");
