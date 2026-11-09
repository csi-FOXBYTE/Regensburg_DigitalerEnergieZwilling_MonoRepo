// Expiry of the public deletion link's download. Kept free of service and
// registry imports so fastify-toab.config.ts can run the startup backfill
// without pulling in the service graph.

const DAY_MS = 24 * 60 * 60 * 1000;

// Validated by the env schema in fastify-toab.config.ts (1 to 9999 days), so
// startup fails on a bad value. Unset (the default) means no expiry.
//
// CAUTION: the TTL expires only the link, never the data. It is not a
// retention control: stored submissions stay until a retention-deletion
// process removes them (none exists yet; its rules for accepted submissions
// are a decision for the city and its data protection officer). The deployment
// add-on leaves it unset by default, so the download has no expiry; whoever
// sets it must also adjust the privacy notice, which promises no expiry.
export const deletionTokenTtlDays = (
  value = process.env.SUBMISSION_DELETION_TOKEN_TTL_DAYS,
): number | null => (value ? Number(value) : null);

export const deletionTokenExpiry = (ttlDays: number | null, now: Date) =>
  ttlDays === null ? null : new Date(now.getTime() + ttlDays * DAY_MS);

type SubmissionExpiryDB = {
  submission: {
    updateMany(
      args:
        | { where: { deletionTokenExpiresAt: null }; data: { deletionTokenExpiresAt: Date } }
        | { where: { deletionTokenExpiresAt: { not: null } }; data: { deletionTokenExpiresAt: null } },
    ): Promise<{ count: number }>;
  };
};

type BackfillLogger = (event: {
  event: "deletion_expiry_backfill" | "deletion_expiry_cleared";
  count: number;
}) => void;

// Brings the stored download expiries in line with the configuration at
// startup. With a TTL configured, submissions without an expiry (stored before
// the TTL existed, or while it was unset) get one counted from now, not from
// their creation, so citizens holding an older PDF keep the full period;
// existing expiries are never touched, so this cannot shorten or extend one.
// Without a TTL ("unset = no expiry") stored expiries are cleared, so links
// issued while a TTL was set download again. Each branch is a single
// conditional UPDATE: idempotent and safe for concurrent replicas, because
// PostgreSQL re-checks the condition on rows another replica updated first.
export const backfillDeletionTokenExpiry = async (
  db: SubmissionExpiryDB,
  ttlDays: number | null,
  log: BackfillLogger,
  now = new Date(),
) => {
  const deletionTokenExpiresAt = deletionTokenExpiry(ttlDays, now);
  if (deletionTokenExpiresAt === null) {
    const { count } = await db.submission.updateMany({
      where: { deletionTokenExpiresAt: { not: null } },
      data: { deletionTokenExpiresAt: null },
    });
    if (count > 0) log({ event: "deletion_expiry_cleared", count });
    return count;
  }

  const { count } = await db.submission.updateMany({
    where: { deletionTokenExpiresAt: null },
    data: { deletionTokenExpiresAt },
  });
  if (count > 0) log({ event: "deletion_expiry_backfill", count });
  return count;
};
