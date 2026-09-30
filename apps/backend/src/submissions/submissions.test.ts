import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import Fastify from "fastify";
import {
  ControllerRegistry,
  fastifyToab,
  type ServiceContainer,
  type ServiceRegistry,
  type WorkerRegistry,
} from "@csi-foxbyte/fastify-toab";
import { routeErrorHandler } from "../errors/route-error-handler.js";
import submissionsPublicController, {
  buildPublicDeletionLink,
} from "../submissionsPublic/submissionsPublic.controller.js";
import { SubmissionNotFoundError } from "./submissions.errors.js";
import {
  assertAvailableByToken,
  deleteByToken,
  getPublicDownloadByToken,
  verifyDeletionReceipt,
} from "./submissions.service.js";

const publicSubmission = {
  id: "submission-1",
  buildingId: "building-1",
  address: "Teststraße 1, Regensburg",
  longitude: 12.1,
  latitude: 49.1,
  createdAt: new Date("2026-08-17T12:00:00.000Z"),
  rawInput: JSON.stringify({ heating: "district" }),
  ngsiData: JSON.stringify({ id: "urn:ngsi-ld:Building:building-1" }),
  usedConfig: { versionName: "2026-08" },
};

const deletionReceipt = {
  version: 1 as const,
  auditEventId: "11111111-1111-4111-8111-111111111111",
  deletedAt: "2026-09-17T12:00:00.000Z",
  action: "SUBMISSION_DELETE" as const,
  actorType: "PUBLIC_CAPABILITY" as const,
  targetType: "SUBMISSION" as const,
  targetId: publicSubmission.id,
  deletedCount: 1,
  verificationSecret: "a".repeat(43),
};

const transaction = <T>(db: object) =>
  mock.fn(async (operation: (tx: object) => Promise<T>) => operation(db));

describe("public submission token service operations", () => {
  it("checks availability with a minimal lookup and rejects unavailable tokens", async () => {
    const findUnique = mock.fn(async (_query: unknown) => ({ id: publicSubmission.id }));
    const db = { submission: { findUnique } };

    await assertAvailableByToken(db as never, "available-token");
    assert.deepEqual(findUnique.mock.calls[0]?.arguments[0], {
      where: { deletionToken: "available-token" },
      select: { id: true },
    });

    const missingDb = {
      submission: { findUnique: mock.fn(async (_query: unknown) => null) },
    };
    await assert.rejects(
      assertAvailableByToken(missingDb as never, "secret-token"),
      (error: unknown) =>
        error instanceof SubmissionNotFoundError &&
        error.message === "Submission not found" &&
        !error.message.includes("secret-token"),
    );
  });

  it("selects only public download fields and preserves a nullable config relation", async () => {
    const findUnique = mock.fn(async (_query: unknown) => publicSubmission);
    const db = { submission: { findUnique } };

    assert.deepEqual(
      await getPublicDownloadByToken(db as never, "download-token"),
      publicSubmission,
    );
    assert.deepEqual(findUnique.mock.calls[0]?.arguments[0], {
      where: { deletionToken: "download-token" },
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

    const withoutConfig = { ...publicSubmission, usedConfig: null };
    const withoutConfigDb = {
      submission: { findUnique: mock.fn(async (_query: unknown) => withoutConfig) },
    };
    assert.equal(
      (await getPublicDownloadByToken(withoutConfigDb as never, "token"))
        .usedConfig,
      null,
    );
  });

  it("physically deletes an existing token and rejects a repeated deletion", async () => {
    const remove = mock.fn(async (_query: unknown) => ({ count: 1 }));
    const createAudit = mock.fn(async (query: unknown) => query);
    const db = {
      submission: {
        findUnique: mock.fn(async (_query: unknown) => ({ id: publicSubmission.id })),
        deleteMany: remove,
      },
      deletionAuditEvent: { create: createAudit },
    };
    Object.assign(db, { $transaction: transaction(db) });

    const receipt = await deleteByToken(db as never, "delete-token");
    assert.deepEqual(remove.mock.calls[0]?.arguments[0], {
      where: { deletionToken: "delete-token" },
    });
    assert.equal(receipt.targetId, publicSubmission.id);
    assert.equal(receipt.actorType, "PUBLIC_CAPABILITY");
    assert.equal(receipt.verificationSecret.length, 43);
    const auditData = createAudit.mock.calls[0]?.arguments[0] as {
      data: Record<string, unknown>;
    };
    assert.equal(auditData.data.actorUserId, undefined);
    assert.equal(auditData.data.actorRole, undefined);
    assert.equal("targetId" in auditData.data, false);
    assert.equal("submissionId" in auditData.data, false);
    assert.equal("deletionToken" in auditData.data, false);

    const verificationDb = {
      deletionAuditEvent: {
        findUnique: mock.fn(async () => ({
          receiptCommitment: auditData.data.receiptCommitment,
        })),
      },
    };
    assert.equal(
      await verifyDeletionReceipt(verificationDb as never, receipt),
      true,
    );
    assert.equal(
      await verifyDeletionReceipt(verificationDb as never, {
        ...receipt,
        targetId: "different-submission",
      }),
      false,
    );

    const missingDb = {
      submission: {
        findUnique: mock.fn(async (_query: unknown) => null),
        deleteMany: mock.fn(async (_query: unknown) => ({ count: 0 })),
      },
    };
    Object.assign(missingDb, { $transaction: transaction(missingDb) });
    await assert.rejects(
      deleteByToken(missingDb as never, "delete-token"),
      SubmissionNotFoundError,
    );
    assert.equal(missingDb.submission.deleteMany.mock.calls.length, 0);
  });
});

describe("public submission routes", () => {
  it("implements the capability contract without the destructive GET route", async (t) => {
    let tokenAvailable = true;
    let includeConfig = true;
    const submit = mock.fn(async () => ({
      ...publicSubmission,
      deletionToken: "opaque-token",
    }));
    const assertAvailable = mock.fn(async () => {
      if (!tokenAvailable) throw new SubmissionNotFoundError();
    });
    const getDownload = mock.fn(async () => {
      if (!tokenAvailable) throw new SubmissionNotFoundError();
      return {
        ...publicSubmission,
        usedConfig: includeConfig ? publicSubmission.usedConfig : null,
      };
    });
    const remove = mock.fn(async () => {
      if (!tokenAvailable) throw new SubmissionNotFoundError();
      tokenAvailable = false;
      return deletionReceipt;
    });
    const verifyReceipt = mock.fn(async (_receipt: unknown) => true);
    const service = {
      submit,
      assertAvailableByToken: assertAvailable,
      getPublicDownloadByToken: getDownload,
      deleteByToken: remove,
      verifyDeletionReceipt: verifyReceipt,
    };
    const serviceContainer: ServiceContainer = {
      get: async <T>() => service as T,
    };
    const serviceRegistry = {
      initializeInstant: async () => undefined,
      resolve: () => serviceContainer,
    } as unknown as ServiceRegistry;
    const controllerRegistry = new ControllerRegistry(serviceRegistry);
    controllerRegistry.register(submissionsPublicController);
    const workerRegistry = {
      getWorker: () => {
        throw new Error("No workers in route tests");
      },
      getQueue: () => {
        throw new Error("No queues in route tests");
      },
    } as unknown as WorkerRegistry;

    const app = Fastify();
    await app.register(fastifyToab, {
      getRegistries: async () => ({
        controllerRegistry,
        serviceRegistry,
        workerRegistry,
      }),
      onRouteError: routeErrorHandler,
    });
    await app.ready();
    t.after(() => app.close());

    const previousBaseUrl = process.env.PUBLIC_CLIENT_BASE_URL;
    process.env.PUBLIC_CLIENT_BASE_URL = "https://public.example/";
    t.after(() => {
      if (previousBaseUrl === undefined)
        Reflect.deleteProperty(process.env, "PUBLIC_CLIENT_BASE_URL");
      else process.env.PUBLIC_CLIENT_BASE_URL = previousBaseUrl;
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/public/submissions",
      payload: {
        input: {},
        buildingId: "building-1",
        address: publicSubmission.address,
        longitude: publicSubmission.longitude,
        latitude: publicSubmission.latitude,
      },
    });
    assert.equal(createResponse.statusCode, 200);
    assert.deepEqual(createResponse.json(), { deletionToken: "opaque-token" });

    const statusResponse = await app.inject({
      method: "GET",
      url: "/api/public/submissions/opaque-token/status",
    });
    assert.equal(statusResponse.statusCode, 200);
    assert.deepEqual(statusResponse.json(), { available: true });
    assert.equal(statusResponse.headers["cache-control"], "no-store");

    const downloadResponse = await app.inject({
      method: "GET",
      url: "/api/public/submissions/opaque-token/download",
    });
    assert.equal(downloadResponse.statusCode, 200);
    assert.match(
      downloadResponse.headers["content-type"] ?? "",
      /^application\/json; charset=utf-8$/,
    );
    assert.equal(
      downloadResponse.headers["content-disposition"],
      'attachment; filename="submission-submission-1.json"',
    );
    assert.equal(downloadResponse.headers["cache-control"], "no-store");
    assert.deepEqual(downloadResponse.json(), {
      id: publicSubmission.id,
      buildingId: publicSubmission.buildingId,
      address: publicSubmission.address,
      longitude: publicSubmission.longitude,
      latitude: publicSubmission.latitude,
      configName: publicSubmission.usedConfig.versionName,
      createdAt: publicSubmission.createdAt.toISOString(),
      raw: JSON.parse(publicSubmission.rawInput),
      ngsiData: JSON.parse(publicSubmission.ngsiData),
      deletionLink: "https://public.example/delete/opaque-token",
    });

    includeConfig = false;
    const withoutConfigResponse = await app.inject({
      method: "GET",
      url: "/api/public/submissions/opaque-token/download",
    });
    assert.equal(withoutConfigResponse.statusCode, 200);
    assert.equal("configName" in withoutConfigResponse.json(), false);

    const oldGetResponse = await app.inject({
      method: "GET",
      url: "/api/public/submissions/opaque-token/delete",
    });
    assert.equal(oldGetResponse.statusCode, 404);
    assert.equal(remove.mock.calls.length, 0);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/api/public/submissions/opaque-token",
    });
    assert.equal(deleteResponse.statusCode, 200);
    assert.deepEqual(deleteResponse.json(), {
      success: true,
      receipt: deletionReceipt,
    });
    assert.equal(deleteResponse.headers["cache-control"], "no-store");

    const verifyResponse = await app.inject({
      method: "POST",
      url: "/api/public/submissions/deletion-receipts/verify",
      payload: deletionReceipt,
    });
    assert.equal(verifyResponse.statusCode, 200);
    assert.deepEqual(verifyResponse.json(), { valid: true });
    assert.equal(verifyResponse.headers["cache-control"], "no-store");
    assert.deepEqual(verifyReceipt.mock.calls[0]?.arguments[0], deletionReceipt);

    for (const request of [
      { method: "GET" as const, url: "/api/public/submissions/opaque-token/status" },
      { method: "GET" as const, url: "/api/public/submissions/opaque-token/download" },
      { method: "DELETE" as const, url: "/api/public/submissions/opaque-token" },
    ]) {
      const response = await app.inject(request);
      assert.equal(response.statusCode, 404);
      assert.equal(response.json().status, "NOT_FOUND");
    }
  });

  it("normalizes and validates public deletion URLs", () => {
    assert.equal(
      buildPublicDeletionLink("https://public.example/base///", "token/with slash"),
      "https://public.example/base/delete/token%2Fwith%20slash",
    );
    assert.throws(() => buildPublicDeletionLink(undefined, "token"));
    assert.throws(() => buildPublicDeletionLink("file:///tmp/public", "token"));
  });
});
