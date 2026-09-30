import { createService } from "@csi-foxbyte/fastify-toab";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  calculate,
  makeNgsiLdEntity,
  validateInput,
  type DETConfig,
} from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import { TransactionIsolationLevel } from "@zenstackhq/orm";
import { getConfigService, getDatabaseService, type ConfigService } from "../@internals/index.js";
import { DEFAULT_VERSION } from "../config/config.service.js";
import { AppError } from "../errors/app-error.js";
import { SubmissionStatus } from "../zenstack/models.js";
import {
  AccessDeniedError,
  BuildingSubmissionsNotDeclinedError,
  ConfigNotFoundError,
  InvalidInputError,
  InvalidStatusTransitionError,
  ReviewCommentRequiredError,
  SubmissionNotFoundError,
  SubmissionOwnershipError,
  UserNotFoundError,
} from "./submissions.errors.js";
import type { DeletionReceiptInput } from "./submissions.dto.js";

type Roles = string[];
type DB = Awaited<ReturnType<typeof getDatabaseService>>;
// `$transaction` is overloaded (callback form + array-batch form). `Parameters<>`
// resolves to the last overload (the array form), so deriving the callback's `tx`
// from it collapses to `never`. The transaction client is the db client without the
// transaction-control methods — mirror ZenStack's own `TransactionClientContract`.
type TxDB = Omit<DB, "$transaction" | "$connect" | "$disconnect" | "$use">;

const CURRENCY = "EUR";
const AUTOMATIC_COMMENT_PREFIX = "Automatischer Statuswechsel durch Freigabe der Einreichung";

const hasAccess = (roles: Roles) =>
  roles.includes("admin") || roles.includes("manager");

type DeletionReceipt = DeletionReceiptInput;

const deletionActorRole = (roles: Roles) =>
  roles.includes("admin") ? "admin" : "manager";

const deletionReceiptCommitment = (receipt: DeletionReceipt) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        version: receipt.version,
        auditEventId: receipt.auditEventId,
        deletedAt: receipt.deletedAt,
        action: receipt.action,
        actorType: receipt.actorType,
        targetType: receipt.targetType,
        targetId: receipt.targetId,
        deletedCount: receipt.deletedCount,
        verificationSecret: receipt.verificationSecret,
      }),
      "utf8",
    )
    .digest("hex");

const createDeletionReceipt = async (
  tx: TxDB,
  params: {
    action: DeletionReceipt["action"];
    actorType: DeletionReceipt["actorType"];
    actorUserId?: string;
    actorRole?: string;
    targetType: DeletionReceipt["targetType"];
    targetId: string;
    deletedCount: number;
  },
) => {
  const deletedAt = new Date();
  const receipt: DeletionReceipt = {
    version: 1,
    auditEventId: randomUUID(),
    deletedAt: deletedAt.toISOString(),
    action: params.action,
    actorType: params.actorType,
    targetType: params.targetType,
    targetId: params.targetId,
    deletedCount: params.deletedCount,
    verificationSecret: randomBytes(32).toString("base64url"),
  };

  await tx.deletionAuditEvent.create({
    data: {
      id: receipt.auditEventId,
      createdAt: deletedAt,
      action: params.action,
      actorType: params.actorType,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      deletedCount: params.deletedCount,
      receiptCommitment: deletionReceiptCommitment(receipt),
    },
  });

  return receipt;
};

export const verifyDeletionReceipt = async (
  db: DB,
  receipt: DeletionReceipt,
) => {
  const auditEvent = await db.deletionAuditEvent.findUnique({
    where: { id: receipt.auditEventId },
    select: { receiptCommitment: true },
  });
  if (!auditEvent) return false;

  const expected = Buffer.from(auditEvent.receiptCommitment, "hex");
  const actual = Buffer.from(deletionReceiptCommitment(receipt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const resolveAddress = (
  submission: { address: string; longitude: number; latitude: number },
  building: { address: string | null; longitude: number | null; latitude: number | null; dataSource: string },
) => {
  if (building.dataSource === "ACTUAL" && building.address != null) {
    return {
      address: building.address,
      longitude: building.longitude ?? submission.longitude,
      latitude: building.latitude ?? submission.latitude,
    };
  }
  return {
    address: submission.address,
    longitude: submission.longitude,
    latitude: submission.latitude,
  };
};

const recordHistory = async (
  tx: TxDB,
  submissionId: string,
  from: SubmissionStatus,
  to: SubmissionStatus,
  byId: string,
  options: { comment?: string; relatedSubmissionId?: string } = {},
) => {
  await tx.submissionChangeHistoryEntry.create({
    data: {
      submissionId,
      from,
      to,
      byId,
      comment: options.comment,
      relatedSubmissionId: options.relatedSubmissionId,
    },
  });
};

const normalizeComment = (comment?: string) => {
  const normalized = comment?.trim();
  return normalized ? normalized : undefined;
};

const submit = async (
  db: DB,
  configService: ConfigService,
  ngsiLdContext: string,
  params: {
    input: unknown;
    configName?: string;
    buildingId: string;
    address: string;
    longitude: number;
    latitude: number;
  },
) => {
  const config = await (params.configName
    ? configService.getConfig(params.configName)
    : configService.getActiveConfig()
  ).catch((e) => {
    if (e instanceof AppError && e.code === 404) throw new ConfigNotFoundError(params.configName);
    throw e;
  });

  const detConfig = JSON.parse(config.calculationConfig) as DETConfig;

  const validation = validateInput(params.input, detConfig);
  if (!validation.success) throw new InvalidInputError(validation.issues);

  const result = calculate(detConfig, validation.data);
  const ngsiEntity = makeNgsiLdEntity(result, CURRENCY, params.buildingId, ngsiLdContext);

  return db.submission.create({
    data: {
      status: "NEW",
      building: {
        connectOrCreate: {
          where: { id: params.buildingId },
          create: { id: params.buildingId },
        },
      },
      address: params.address,
      longitude: params.longitude,
      latitude: params.latitude,
      ngsiData: JSON.stringify(ngsiEntity),
      rawInput: JSON.stringify(params.input),
      // The virtual default config has no persisted row to reference — leave
      // usedConfigId null to record that it was calculated with the default.
      usedConfig:
        config.id === DEFAULT_VERSION ? undefined : { connect: { id: config.id } },
    },
  });
};

const assign = async (
  db: DB,
  submissionId: string,
  userId: string,
  roles: Roles,
  targetUserId?: string,
) => {
  if (!hasAccess(roles)) throw new AccessDeniedError();

  const submission = await db.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new SubmissionNotFoundError(submissionId);
  if (submission.status !== SubmissionStatus.NEW)
    throw new InvalidStatusTransitionError(submission.status, SubmissionStatus.ASSIGNED);

  const assignToId = targetUserId ?? userId;

  if (targetUserId) {
    const target = await db.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new UserNotFoundError(targetUserId);
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.ASSIGNED, assignedToId: assignToId, assignedAt: new Date() },
    });
    await recordHistory(tx, submissionId, SubmissionStatus.NEW, SubmissionStatus.ASSIGNED, userId);
    return updated;
  });
};

const unAssign = async (db: DB, submissionId: string, userId: string, roles: Roles) => {
  if (!hasAccess(roles)) throw new AccessDeniedError();

  const submission = await db.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new SubmissionNotFoundError(submissionId);
  if (submission.status !== SubmissionStatus.ASSIGNED)
    throw new InvalidStatusTransitionError(submission.status, SubmissionStatus.NEW);
  if (!roles.includes("admin") && submission.assignedToId !== userId)
    throw new SubmissionOwnershipError();

  return db.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.NEW, assignedToId: null, assignedAt: null },
    });
    await recordHistory(tx, submissionId, SubmissionStatus.ASSIGNED, SubmissionStatus.NEW, userId);
    return updated;
  });
};

const list = async (
  db: DB,
  params: {
    managerId?: string;
    status?: SubmissionStatus;
    sortBy?: "status" | "submitted";
    skip?: number;
    limit?: number;
  },
) => {
  const submissionFilter = {
    ...(params.managerId ? { assignedToId: params.managerId } : {}),
    ...(params.status ? { status: params.status } : {}),
  };

  const submissionOrderBy =
    params.sortBy === "status"
      ? { status: "asc" as const }
      : { createdAt: "desc" as const };

  const buildingWhere = { submissions: { some: submissionFilter } };

  const buildingsPromise = db.building.findMany({
    where: buildingWhere,
    skip: params.skip ?? 0,
    take: params.limit ?? 20,
    include: {
      submissions: {
        where: submissionFilter,
        orderBy: submissionOrderBy,
      },
    },
  });
  const totalPromise = db.building.count({ where: buildingWhere });

  const buildings = await buildingsPromise;
  const total = await totalPromise;

  const buildingIds = buildings.map((b) => b.id);
  const allSubmissionsForBuildings = await db.submission.findMany({
    where: { buildingId: { in: buildingIds } },
    select: { buildingId: true },
  });
  const countByBuilding = new Map<string, number>();
  for (const s of allSubmissionsForBuildings) {
    countByBuilding.set(s.buildingId, (countByBuilding.get(s.buildingId) ?? 0) + 1);
  }

  const data = buildings.map((building) => {
    const first = building.submissions[0];
    const { address, longitude, latitude } = resolveAddress(first, building);
    return {
      buildingId: building.id,
      address,
      longitude,
      latitude,
      submissionCount: countByBuilding.get(building.id) ?? 0,
      submissions: building.submissions.map((s) => ({
        id: s.id,
        status: s.status,
        assignedToId: s.assignedToId,
        createdAt: s.createdAt,
      })),
    };
  });

  return { data, total };
};

const getById = async (db: DB, configService: ConfigService, submissionId: string) => {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      building: true,
      assignedTo: true,
      usedConfig: true,
      history: { include: { by: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!submission) throw new SubmissionNotFoundError(submissionId);

  const otherSubmissions = await db.submission.findMany({
    where: { buildingId: submission.buildingId, id: { not: submissionId } },
    select: { id: true, status: true },
  });

  const { address, longitude, latitude } = resolveAddress(submission, submission.building);

  const usedConfig =
    submission.usedConfig ?? (await configService.getConfig(DEFAULT_VERSION));

  return {
    ...submission,
    usedConfig,
    address,
    longitude,
    latitude,
    otherSubmissionIds: otherSubmissions.map((s) => s.id),
    currentAcceptedSubmissionId:
      submission.status === SubmissionStatus.ACCEPTED
        ? submission.id
        : (otherSubmissions.find((s) => s.status === SubmissionStatus.ACCEPTED)?.id ?? null),
    allSubmissionsDeclined:
      submission.status === SubmissionStatus.DECLINED &&
      otherSubmissions.every((s) => s.status === SubmissionStatus.DECLINED),
    submissionCount: otherSubmissions.length + 1,
  };
};

export const accept = async (
  db: DB,
  submissionId: string,
  userId: string,
  roles: Roles,
  comment?: string,
) => {
  if (!hasAccess(roles)) throw new AccessDeniedError();

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: { building: true },
  });
  if (!submission) throw new SubmissionNotFoundError(submissionId);
  if (submission.status !== SubmissionStatus.ASSIGNED)
    throw new InvalidStatusTransitionError(submission.status, SubmissionStatus.ACCEPTED);
  if (submission.assignedToId !== userId && !roles.includes("admin"))
    throw new SubmissionOwnershipError();

  return db.$transaction(async (tx) => {
    const siblingSubmissions = await tx.submission.findMany({
      where: { buildingId: submission.buildingId, id: { not: submissionId } },
      select: { id: true, status: true },
    });

    const supersededSubmissionIds: string[] = [];
    const declinedSubmissionIds: string[] = [];

    for (const sibling of siblingSubmissions) {
      if (sibling.status === SubmissionStatus.ACCEPTED) {
        const changed = await tx.submission.updateMany({
          where: { id: sibling.id, status: SubmissionStatus.ACCEPTED },
          data: { status: SubmissionStatus.SUPERSEDED },
        });
        if (changed.count === 1) {
          supersededSubmissionIds.push(sibling.id);
          await recordHistory(
            tx,
            sibling.id,
            SubmissionStatus.ACCEPTED,
            SubmissionStatus.SUPERSEDED,
            userId,
            {
              comment: `${AUTOMATIC_COMMENT_PREFIX} ${submissionId}.`,
              relatedSubmissionId: submissionId,
            },
          );
        }
      } else if (
        sibling.status === SubmissionStatus.NEW ||
        sibling.status === SubmissionStatus.ASSIGNED
      ) {
        const changed = await tx.submission.updateMany({
          where: { id: sibling.id, status: sibling.status },
          data: { status: SubmissionStatus.DECLINED },
        });
        if (changed.count === 1) {
          declinedSubmissionIds.push(sibling.id);
          await recordHistory(
            tx,
            sibling.id,
            sibling.status,
            SubmissionStatus.DECLINED,
            userId,
            {
              comment: `${AUTOMATIC_COMMENT_PREFIX} ${submissionId}.`,
              relatedSubmissionId: submissionId,
            },
          );
        }
      }
    }

    const accepted = await tx.submission.updateMany({
      where: { id: submissionId, status: SubmissionStatus.ASSIGNED },
      data: { status: SubmissionStatus.ACCEPTED },
    });
    if (accepted.count !== 1)
      throw new InvalidStatusTransitionError(submission.status, SubmissionStatus.ACCEPTED);

    if (submission.buildingId && submission.building.dataSource !== "ACTUAL") {
      await tx.building.upsert({
        where: { id: submission.buildingId },
        create: {
          id: submission.buildingId,
          address: submission.address,
          longitude: submission.longitude,
          latitude: submission.latitude,
          dataSource: "USER",
        },
        update: {
          address: submission.address,
          longitude: submission.longitude,
          latitude: submission.latitude,
          dataSource: "USER",
        },
      });
    }
    await recordHistory(
      tx,
      submissionId,
      SubmissionStatus.ASSIGNED,
      SubmissionStatus.ACCEPTED,
      userId,
      { comment: normalizeComment(comment) },
    );
    const updated = await tx.submission.findUnique({ where: { id: submissionId } });
    if (!updated) throw new SubmissionNotFoundError(submissionId);
    return { submission: updated, supersededSubmissionIds, declinedSubmissionIds };
  }, { isolationLevel: TransactionIsolationLevel.Serializable });
};

export const decline = async (
  db: DB,
  submissionId: string,
  userId: string,
  roles: Roles,
  comment?: string,
) => {
  if (!hasAccess(roles)) throw new AccessDeniedError();

  const normalizedComment = normalizeComment(comment);
  if (!normalizedComment) throw new ReviewCommentRequiredError();

  const submission = await db.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new SubmissionNotFoundError(submissionId);
  if (submission.status !== SubmissionStatus.ASSIGNED)
    throw new InvalidStatusTransitionError(submission.status, SubmissionStatus.DECLINED);
  if (submission.assignedToId !== userId && !roles.includes("admin"))
    throw new SubmissionOwnershipError();

  return db.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.DECLINED },
    });
    await recordHistory(
      tx,
      submissionId,
      SubmissionStatus.ASSIGNED,
      SubmissionStatus.DECLINED,
      userId,
      { comment: normalizedComment },
    );
    return updated;
  });
};

export const assertAvailableByToken = async (db: DB, deletionToken: string) => {
  const submission = await db.submission.findUnique({
    where: { deletionToken },
    select: { id: true },
  });
  if (!submission) throw new SubmissionNotFoundError();
};

export const getPublicDownloadByToken = async (db: DB, deletionToken: string) => {
  const submission = await db.submission.findUnique({
    where: { deletionToken },
    select: {
      id: true,
      buildingId: true,
      address: true,
      longitude: true,
      latitude: true,
      createdAt: true,
      rawInput: true,
      ngsiData: true,
      usedConfig: { select: { versionName: true } },
    },
  });
  if (!submission) throw new SubmissionNotFoundError();
  return submission;
};

export const deleteByToken = async (db: DB, deletionToken: string) => {
  return db.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { deletionToken },
      select: { id: true },
    });
    if (!submission) throw new SubmissionNotFoundError();

    const deleted = await tx.submission.deleteMany({
      where: { deletionToken },
    });
    if (deleted.count !== 1) throw new SubmissionNotFoundError();

    return createDeletionReceipt(tx, {
      action: "SUBMISSION_DELETE",
      actorType: "PUBLIC_CAPABILITY",
      targetType: "SUBMISSION",
      targetId: submission.id,
      deletedCount: 1,
    });
  }, { isolationLevel: TransactionIsolationLevel.Serializable });
};

export const deleteById = async (db: DB, submissionId: string, userId: string, roles: Roles) => {
  if (!hasAccess(roles)) throw new AccessDeniedError();
  return db.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new SubmissionNotFoundError(submissionId);
    if (submission.assignedToId != null && !roles.includes("admin") && submission.assignedToId !== userId)
      throw new SubmissionOwnershipError();

    const deleted = await tx.submission.delete({ where: { id: submissionId } });
    const receipt = await createDeletionReceipt(tx, {
      action: "SUBMISSION_DELETE",
      actorType: "ADMIN",
      actorUserId: userId,
      actorRole: deletionActorRole(roles),
      targetType: "SUBMISSION",
      targetId: submissionId,
      deletedCount: 1,
    });
    return { id: deleted.id, receipt };
  }, { isolationLevel: TransactionIsolationLevel.Serializable });
};

export const deleteBuildingSubmissions = async (
  db: DB,
  buildingId: string,
  userId: string,
  roles: Roles,
) => {
  if (!hasAccess(roles)) throw new AccessDeniedError();

  return db.$transaction(async (tx) => {
    const submissions = await tx.submission.findMany({
      where: { buildingId },
      select: { id: true, status: true },
    });
    if (submissions.length === 0) throw new SubmissionNotFoundError();
    if (submissions.some((submission) => submission.status !== SubmissionStatus.DECLINED))
      throw new BuildingSubmissionsNotDeclinedError(buildingId);

    const deleted = await tx.submission.deleteMany({
      where: { buildingId, status: SubmissionStatus.DECLINED },
    });
    if (deleted.count !== submissions.length)
      throw new BuildingSubmissionsNotDeclinedError(buildingId);

    const remaining = await tx.submission.count({ where: { buildingId } });
    if (remaining !== 0)
      throw new BuildingSubmissionsNotDeclinedError(buildingId);

    const receipt = await createDeletionReceipt(tx, {
      action: "BUILDING_SUBMISSIONS_DELETE",
      actorType: "ADMIN",
      actorUserId: userId,
      actorRole: deletionActorRole(roles),
      targetType: "BUILDING",
      targetId: buildingId,
      deletedCount: deleted.count,
    });
    return { buildingId, deletedCount: deleted.count, receipt };
  }, { isolationLevel: TransactionIsolationLevel.Serializable });
};

const submissionsService = createService("submissions", async ({ services }) => {
  const db = await getDatabaseService(services);
  const configService = await getConfigService(services);
  const ngsiLdContext = `${process.env.APP_BASE_URL}/public/det-building-energy-data-context.jsonld`;

  return {
    submit: (params: Parameters<typeof submit>[3]) => submit(db, configService, ngsiLdContext, params),
    assertAvailableByToken: (deletionToken: string) =>
      assertAvailableByToken(db, deletionToken),
    getPublicDownloadByToken: (deletionToken: string) =>
      getPublicDownloadByToken(db, deletionToken),
    deleteByToken: (deletionToken: string) => deleteByToken(db, deletionToken),
    verifyDeletionReceipt: (receipt: DeletionReceipt) =>
      verifyDeletionReceipt(db, receipt),
    deleteById: (submissionId: string, userId: string, roles: Roles) => deleteById(db, submissionId, userId, roles),
    deleteBuildingSubmissions: (buildingId: string, userId: string, roles: Roles) =>
      deleteBuildingSubmissions(db, buildingId, userId, roles),
    assign: (submissionId: string, userId: string, roles: Roles, targetUserId?: string) =>
      assign(db, submissionId, userId, roles, targetUserId),
    unAssign: (submissionId: string, userId: string, roles: Roles) =>
      unAssign(db, submissionId, userId, roles),
    list: (params: Parameters<typeof list>[1]) => list(db, params),
    getById: (submissionId: string) => getById(db, configService, submissionId),
    accept: (submissionId: string, userId: string, roles: Roles, comment?: string) =>
      accept(db, submissionId, userId, roles, comment),
    decline: (submissionId: string, userId: string, roles: Roles, comment?: string) =>
      decline(db, submissionId, userId, roles, comment),
  };
});

export default submissionsService;
