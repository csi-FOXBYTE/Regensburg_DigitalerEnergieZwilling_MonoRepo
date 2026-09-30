import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { describe, it, mock } from "node:test";
import {
  ControllerRegistry,
  fastifyToab,
  type ServiceContainer,
  type ServiceRegistry,
  type WorkerRegistry,
} from "@csi-foxbyte/fastify-toab";
import Fastify from "fastify";
import pino from "pino";
import feedbackAdminController from "../feedbackAdmin/feedbackAdmin.controller.js";
import feedbackPublicController from "../feedbackPublic/feedbackPublic.controller.js";
import { AppError } from "../errors/app-error.js";
import { routeErrorHandler } from "../errors/route-error-handler.js";
import {
  FeedbackNotFoundError,
  InvalidFeedbackError,
} from "./feedback.errors.js";
import {
  createFeedback,
  deleteFeedbackById,
  getFeedbackById,
  listFeedback,
  normalizeFeedbackInput,
  parseFeedbackCategoryFilter,
} from "./feedback.service.js";

const storedFeedback = {
  id: "feedback-1",
  category: "bug" as const,
  message: "Something broke",
  emailAddress: null,
  createdAt: new Date("2026-08-24T12:00:00.000Z"),
  updatedAt: new Date("2026-08-24T12:00:00.000Z"),
};

const createTestApp = async (
  feedbackService: Record<string, (...args: never[]) => unknown>,
  resolveRole: (authorization: string | undefined) => string | undefined = () =>
    undefined,
  logOutput?: string[],
) => {
  const authService = {
    verifyRequest: mock.fn(async (request: { headers: { authorization?: string } }) => {
      const role = resolveRole(request.headers.authorization);
      if (!role)
        throw new AppError({
          status: "UNAUTHORIZED",
          code: 401,
          message: "Missing access token",
        });
      return {
        resource_access: {
          "digital-energy-twin": { roles: [role] },
        },
      };
    }),
  };
  const serviceContainer: ServiceContainer = {
    get: async <T>(name: string) =>
      (name === "auth" ? authService : feedbackService) as T,
  };
  const serviceRegistry = {
    initializeInstant: async () => undefined,
    resolve: () => serviceContainer,
  } as unknown as ServiceRegistry;
  const controllerRegistry = new ControllerRegistry(serviceRegistry);
  controllerRegistry.register(feedbackPublicController);
  controllerRegistry.register(feedbackAdminController);
  const workerRegistry = {
    getWorker: () => {
      throw new Error("No workers in feedback route tests");
    },
    getQueue: () => {
      throw new Error("No queues in feedback route tests");
    },
  } as unknown as WorkerRegistry;

  const loggerInstance = logOutput
    ? pino(
        { level: "warn" },
        new Writable({
          write(chunk, _encoding, callback) {
            logOutput.push(chunk.toString());
            callback();
          },
        }),
      )
    : undefined;
  const app = Fastify(loggerInstance ? { loggerInstance } : {});
  await app.register(fastifyToab, {
    getRegistries: async () => ({
      controllerRegistry,
      serviceRegistry,
      workerRegistry,
    }),
    onRouteError: routeErrorHandler,
  });
  await app.ready();
  return app;
};

describe("feedback service", () => {
  it("normalizes valid creation input before persistence", async () => {
    const create = mock.fn(async (query: unknown) => ({
      ...storedFeedback,
      ...((query as { data: object }).data),
    }));
    const db = { feedback: { create } };

    await createFeedback(db as never, {
      category: "suggestion",
      message: "  Improve this  ",
      emailAddress: "  Person@Example.COM ",
    });

    assert.deepEqual(create.mock.calls[0]?.arguments[0], {
      data: {
        category: "suggestion",
        message: "Improve this",
        emailAddress: "person@example.com",
      },
    });
    assert.deepEqual(normalizeFeedbackInput({
      category: "feedback",
      message: " Fine ",
    }), {
      category: "feedback",
      message: "Fine",
      emailAddress: undefined,
    });
  });

  it("rejects invalid messages, categories, and provided email values", () => {
    for (const input of [
      { category: "bug", message: "   " },
      { category: "bug", message: "x".repeat(5_001) },
      { category: "unknown", message: "valid" },
      { category: "bug", message: "valid", emailAddress: "" },
      { category: "bug", message: "valid", emailAddress: "not-an-email" },
      { category: "bug", message: "valid", emailAddress: null },
      {
        category: "bug",
        message: "valid",
        emailAddress: `${"a".repeat(309)}@example.com`,
      },
    ]) {
      assert.throws(
        () => normalizeFeedbackInput(input as never),
        InvalidFeedbackError,
      );
    }
  });

  it("parses strict comma-separated category filters", () => {
    assert.equal(parseFeedbackCategoryFilter(undefined), undefined);
    assert.deepEqual(parseFeedbackCategoryFilter("bug,suggestion,bug"), [
      "bug",
      "suggestion",
    ]);
    for (const filter of ["", "bug,", ",bug", "bug,unknown", "bug, suggestion"])
      assert.throws(
        () => parseFeedbackCategoryFilter(filter),
        InvalidFeedbackError,
      );
  });

  it("lists with filtered totals, defaults, and deterministic ordering", async () => {
    const findMany = mock.fn(async (_query: unknown) => [storedFeedback]);
    const count = mock.fn(async (_query: unknown) => 7);
    const db = { feedback: { findMany, count } };

    assert.deepEqual(
      await listFeedback(db as never, { category: "bug,feedback,bug" }),
      { data: [storedFeedback], total: 7 },
    );
    assert.deepEqual(findMany.mock.calls[0]?.arguments[0], {
      where: { category: { in: ["bug", "feedback"] } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: 0,
      take: 20,
    });
    assert.deepEqual(count.mock.calls[0]?.arguments[0], {
      where: { category: { in: ["bug", "feedback"] } },
    });

    await listFeedback(db as never, {
      sortBy: "category",
      sortOrder: "asc",
      skip: 4,
      limit: 12,
    });
    assert.deepEqual(findMany.mock.calls[1]?.arguments[0], {
      where: {},
      orderBy: [{ category: "asc" }, { id: "asc" }],
      skip: 4,
      take: 12,
    });
  });

  it("retrieves and permanently deletes records with not-found errors", async () => {
    const db = {
      feedback: {
        findUnique: mock.fn(async (_query: unknown) => storedFeedback),
        deleteMany: mock.fn(async (_query: unknown) => ({ count: 1 })),
      },
    };
    assert.equal(await getFeedbackById(db as never, "feedback-1"), storedFeedback);
    await deleteFeedbackById(db as never, "feedback-1");
    assert.deepEqual(db.feedback.deleteMany.mock.calls[0]?.arguments[0], {
      where: { id: "feedback-1" },
    });

    const missingDb = {
      feedback: {
        findUnique: mock.fn(async (_query: unknown) => null),
        deleteMany: mock.fn(async (_query: unknown) => ({ count: 0 })),
      },
    };
    await assert.rejects(
      getFeedbackById(missingDb as never, "missing"),
      FeedbackNotFoundError,
    );
    await assert.rejects(
      deleteFeedbackById(missingDb as never, "missing"),
      FeedbackNotFoundError,
    );
  });
});

describe("feedback routes", () => {
  it("creates anonymously with an empty 201 response", async (t) => {
    const logOutput: string[] = [];
    const create = mock.fn(async (input: unknown) => {
      normalizeFeedbackInput(input as never);
      return storedFeedback;
    });
    const app = await createTestApp({ create }, undefined, logOutput);
    t.after(() => app.close());

    const response = await app.inject({
      method: "POST",
      url: "/api/public/feedback",
      payload: { category: "bug", message: "A problem" },
    });
    assert.equal(response.statusCode, 201);
    assert.equal(response.body, "");
    assert.deepEqual(create.mock.calls[0]?.arguments[0], {
      category: "bug",
      message: "A problem",
    });

    const invalidCategory = await app.inject({
      method: "POST",
      url: "/api/public/feedback",
      payload: { category: "BUG", message: "A problem" },
    });
    assert.equal(invalidCategory.statusCode, 400);

    const nullEmail = await app.inject({
      method: "POST",
      url: "/api/public/feedback",
      payload: {
        category: "feedback",
        message: "A thought",
        emailAddress: null,
      },
    });
    assert.equal(nullEmail.statusCode, 400);

    const invalidMessage = await app.inject({
      method: "POST",
      url: "/api/public/feedback",
      payload: { category: "bug", message: " " },
    });
    assert.equal(invalidMessage.statusCode, 400);
    assert.doesNotMatch(logOutput.join(""), /FST_ERR_REP_ALREADY_SENT/);
  });

  it("lists and reads full entities for admin and maintainer only", async (t) => {
    const list = mock.fn(async (_query: unknown) => ({
      data: [storedFeedback],
      total: 1,
    }));
    const getById = mock.fn(async (_id: unknown) => storedFeedback);
    const app = await createTestApp(
      { list, getById },
      (authorization) => authorization?.replace("Bearer ", ""),
    );
    t.after(() => app.close());

    for (const role of ["admin", "maintainer"]) {
      const listResponse = await app.inject({
        method: "GET",
        url: "/api/admin/feedback?category=bug,suggestion&skip=2&limit=10&sortBy=category&sortOrder=asc",
        headers: { authorization: `Bearer ${role}` },
      });
      assert.equal(listResponse.statusCode, 200);
      assert.deepEqual(listResponse.json(), {
        data: [{
          ...storedFeedback,
          createdAt: storedFeedback.createdAt.toISOString(),
          updatedAt: storedFeedback.updatedAt.toISOString(),
        }],
        total: 1,
      });

      const getResponse = await app.inject({
        method: "GET",
        url: "/api/admin/feedback/feedback-1",
        headers: { authorization: `Bearer ${role}` },
      });
      assert.equal(getResponse.statusCode, 200);
      assert.equal(getResponse.json().emailAddress, null);
    }
    assert.deepEqual({
      ...(list.mock.calls[0]?.arguments[0] as Record<string, unknown>),
    }, {
      category: "bug,suggestion",
      skip: 2,
      limit: 10,
      sortBy: "category",
      sortOrder: "asc",
    });

    for (const authorization of [undefined, "Bearer manager"]) {
      const response = await app.inject({
        method: "GET",
        url: "/api/admin/feedback",
        headers: authorization ? { authorization } : {},
      });
      assert.equal(response.statusCode, authorization ? 403 : 401);
    }
  });

  it("hard-deletes with empty 204 and translates missing IDs", async (t) => {
    const logOutput: string[] = [];
    let exists = true;
    const deleteById = mock.fn(async (_id: unknown) => {
      if (!exists) throw new FeedbackNotFoundError("feedback-1");
      exists = false;
    });
    const getById = mock.fn(async (_id: unknown) => {
      throw new FeedbackNotFoundError("missing");
    });
    const app = await createTestApp(
      { deleteById, getById },
      (authorization) => authorization?.replace("Bearer ", ""),
      logOutput,
    );
    t.after(() => app.close());

    const managerDenied = await app.inject({
      method: "DELETE",
      url: "/api/admin/feedback/feedback-1",
      headers: { authorization: "Bearer manager" },
    });
    assert.equal(managerDenied.statusCode, 403);
    assert.equal(deleteById.mock.calls.length, 0);

    const deleted = await app.inject({
      method: "DELETE",
      url: "/api/admin/feedback/feedback-1",
      headers: { authorization: "Bearer maintainer" },
    });
    assert.equal(deleted.statusCode, 204);
    assert.equal(deleted.body, "");

    const repeated = await app.inject({
      method: "DELETE",
      url: "/api/admin/feedback/feedback-1",
      headers: { authorization: "Bearer admin" },
    });
    assert.equal(repeated.statusCode, 404);

    const missing = await app.inject({
      method: "GET",
      url: "/api/admin/feedback/missing",
      headers: { authorization: "Bearer admin" },
    });
    assert.equal(missing.statusCode, 404);
    assert.doesNotMatch(logOutput.join(""), /FST_ERR_REP_ALREADY_SENT/);
  });
});
