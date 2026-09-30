-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_usedConfigId_fkey";

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "usedConfigId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_usedConfigId_fkey" FOREIGN KEY ("usedConfigId") REFERENCES "Config"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove the formerly persisted default config. References to it are set to NULL
-- by the foreign key above, which represents use of the virtual default config.
DELETE FROM "Config" WHERE "versionName" = 'DEFAULT';
