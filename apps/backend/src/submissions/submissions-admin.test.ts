import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { SubmissionStatus } from "../zenstack/models.js";
import {
  BuildingSubmissionsNotDeclinedError,
  ReviewCommentRequiredError,
} from "./submissions.errors.js";
import {
  accept,
  decline,
  deleteById,
  deleteBuildingSubmissions,
} from "./submissions.service.js";

const transaction = <T>(db: object) =>
  mock.fn(async (operation: (tx: object) => Promise<T>) => operation(db));

describe("admin submission decisions", () => {
  it("accepts one submission and atomically supersedes or declines its siblings", async () => {
    const target = {
      id: "new-accepted",
      buildingId: "building-1",
      status: SubmissionStatus.ASSIGNED,
      assignedToId: "reviewer-1",
      assignedAt: new Date(),
      building: { dataSource: "USER" },
    };
    let findUniqueCalls = 0;
    const findUnique = mock.fn(async () => {
      findUniqueCalls += 1;
      return findUniqueCalls === 1
        ? target
        : { ...target, status: SubmissionStatus.ACCEPTED };
    });
    const findMany = mock.fn(async () => [
      { id: "old-accepted", status: SubmissionStatus.ACCEPTED },
      { id: "open-new", status: SubmissionStatus.NEW },
      { id: "open-assigned", status: SubmissionStatus.ASSIGNED },
      { id: "already-declined", status: SubmissionStatus.DECLINED },
    ]);
    const updateMany = mock.fn(async () => ({ count: 1 }));
    const createHistory = mock.fn(async (_query: unknown) => ({}));
    const upsertBuilding = mock.fn(async (_query: unknown) => ({}));
    const db = {
      submission: { findUnique, findMany, updateMany },
      submissionChangeHistoryEntry: { create: createHistory },
      building: { upsert: upsertBuilding },
    };
    Object.assign(db, { $transaction: transaction(db) });

    const result = await accept(
      db as never,
      target.id,
      "reviewer-1",
      ["manager"],
      "Fachlich geprüft",
    );

    assert.deepEqual(result.supersededSubmissionIds, ["old-accepted"]);
    assert.deepEqual(result.declinedSubmissionIds, ["open-new", "open-assigned"]);
    assert.equal(result.submission.status, SubmissionStatus.ACCEPTED);
    assert.equal(createHistory.mock.calls.length, 4);
    assert.deepEqual(createHistory.mock.calls[0]?.arguments[0], {
      data: {
        submissionId: "old-accepted",
        from: SubmissionStatus.ACCEPTED,
        to: SubmissionStatus.SUPERSEDED,
        byId: "reviewer-1",
        comment:
          "Automatischer Statuswechsel durch Freigabe der Einreichung new-accepted.",
        relatedSubmissionId: "new-accepted",
      },
    });
    assert.deepEqual(createHistory.mock.calls[3]?.arguments[0], {
      data: {
        submissionId: "new-accepted",
        from: SubmissionStatus.ASSIGNED,
        to: SubmissionStatus.ACCEPTED,
        byId: "reviewer-1",
        comment: "Fachlich geprüft",
        relatedSubmissionId: undefined,
      },
    });
  });

  it("persists a trimmed decline comment and rejects an empty comment", async () => {
    const target = {
      id: "declined-1",
      status: SubmissionStatus.ASSIGNED,
      assignedToId: "reviewer-1",
    };
    const createHistory = mock.fn(async (_query: unknown) => ({}));
    const db = {
      submission: {
        findUnique: mock.fn(async () => target),
        update: mock.fn(async () => ({
          ...target,
          status: SubmissionStatus.DECLINED,
        })),
      },
      submissionChangeHistoryEntry: { create: createHistory },
    };
    Object.assign(db, { $transaction: transaction(db) });

    await decline(
      db as never,
      target.id,
      "reviewer-1",
      ["manager"],
      "  Nicht plausibel  ",
    );
    assert.equal(createHistory.mock.calls.length, 1);
    assert.equal(
      (createHistory.mock.calls[0].arguments[0] as { data: { comment: string } })
        .data.comment,
      "Nicht plausibel",
    );
    await assert.rejects(
      decline(db as never, target.id, "reviewer-1", ["manager"], "   "),
      ReviewCommentRequiredError,
    );
  });
});

describe("bundled submission deletion", () => {
  it("deletes all submissions when every submission of the building is declined", async () => {
    const createAudit = mock.fn(async (query: unknown) => query);
    const db = {
      submission: {
        findMany: mock.fn(async () => [
          { id: "one", status: SubmissionStatus.DECLINED },
          { id: "two", status: SubmissionStatus.DECLINED },
        ]),
        deleteMany: mock.fn(async () => ({ count: 2 })),
        count: mock.fn(async () => 0),
      },
      deletionAuditEvent: { create: createAudit },
    };
    Object.assign(db, { $transaction: transaction(db) });

    const result = await deleteBuildingSubmissions(
      db as never,
      "building-1",
      "reviewer-1",
      ["manager"],
    );
    assert.equal(result.buildingId, "building-1");
    assert.equal(result.deletedCount, 2);
    assert.equal(result.receipt.targetId, "building-1");
    assert.equal(result.receipt.targetType, "BUILDING");
    const auditData = createAudit.mock.calls[0]?.arguments[0] as {
      data: Record<string, unknown>;
    };
    assert.equal(auditData.data.actorUserId, "reviewer-1");
    assert.equal(auditData.data.actorRole, "manager");
    assert.equal(auditData.data.deletedCount, 2);
    assert.equal("buildingId" in auditData.data, false);
    assert.equal("targetId" in auditData.data, false);
  });

  it("rejects bundled deletion when one submission is not declined", async () => {
    const db = {
      submission: {
        findMany: mock.fn(async () => [
          { id: "one", status: SubmissionStatus.DECLINED },
          { id: "two", status: SubmissionStatus.SUPERSEDED },
        ]),
        deleteMany: mock.fn(async () => ({ count: 0 })),
        count: mock.fn(async () => 2),
      },
    };
    Object.assign(db, { $transaction: transaction(db) });

    await assert.rejects(
      deleteBuildingSubmissions(
        db as never,
        "building-1",
        "reviewer-1",
        ["manager"],
      ),
      BuildingSubmissionsNotDeclinedError,
    );
    assert.equal(db.submission.deleteMany.mock.calls.length, 0);
  });

  it("records the authenticated user without retaining the deleted submission id", async () => {
    const createAudit = mock.fn(async (query: unknown) => query);
    const db = {
      submission: {
        findUnique: mock.fn(async () => ({
          id: "submission-1",
          assignedToId: "reviewer-1",
        })),
        delete: mock.fn(async () => ({ id: "submission-1" })),
      },
      deletionAuditEvent: { create: createAudit },
    };
    Object.assign(db, { $transaction: transaction(db) });

    const result = await deleteById(
      db as never,
      "submission-1",
      "reviewer-1",
      ["manager"],
    );
    assert.equal(result.id, "submission-1");
    assert.equal(result.receipt.targetId, "submission-1");
    const auditData = createAudit.mock.calls[0]?.arguments[0] as {
      data: Record<string, unknown>;
    };
    assert.equal(auditData.data.actorUserId, "reviewer-1");
    assert.equal(auditData.data.actorRole, "manager");
    assert.equal("submissionId" in auditData.data, false);
    assert.equal("targetId" in auditData.data, false);
  });
});
