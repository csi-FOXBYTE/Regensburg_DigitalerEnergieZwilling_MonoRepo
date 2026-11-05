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
// add-on enables it (30 days) before that process exists, to limit how long a
// leaked download link works; align it with the retention period once defined.
export const deletionTokenTtlDays = (
  value = process.env.SUBMISSION_DELETION_TOKEN_TTL_DAYS,
): number | null => (value ? Number(value) : null);

export const deletionTokenExpiry = (ttlDays: number | null, now: Date) =>
  ttlDays === null ? null : new Date(now.getTime() + ttlDays * DAY_MS);

type SubmissionExpiryDB = {
  submission: {
    updateMany(args: {
      where: { deletionTokenExpiresAt: null };
      data: { deletionTokenExpiresAt: Date };
    }): Promise<{ count: number }>;
  };
};

type BackfillLogger = (event: { event: "deletion_expiry_backfill"; count: number }) => void;

// Submissions stored without an expiry (before the TTL existed, or while it
// was unset) would keep a working download link forever. With a TTL
// configured, give them one counted from now, not from their creation, so
// citizens holding an older PDF keep the full period. Without a TTL nothing
// changes ("unset = no expiry"). Existing expiries are never touched, so the
// step cannot shorten or extend one. A single conditional UPDATE is
// idempotent and safe for concurrent replicas: PostgreSQL re-checks
// `IS NULL` on rows another replica updated first, so they are skipped.
export const backfillDeletionTokenExpiry = async (
  db: SubmissionExpiryDB,
  ttlDays: number | null,
  log: BackfillLogger,
  now = new Date(),
) => {
  const deletionTokenExpiresAt = deletionTokenExpiry(ttlDays, now);
  if (deletionTokenExpiresAt === null) return 0;

  const { count } = await db.submission.updateMany({
    where: { deletionTokenExpiresAt: null },
    data: { deletionTokenExpiresAt },
  });
  if (count > 0) log({ event: "deletion_expiry_backfill", count });
  return count;
};
