import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { it } from "node:test";
import Fastify from "fastify";
import {
  ControllerRegistry,
  fastifyToab,
  type ServiceContainer,
  type ServiceRegistry,
  type WorkerRegistry,
} from "@csi-foxbyte/fastify-toab";
import configController from "../config/config.controller.js";
import configService from "../config/config.service.js";
import { createPrivacyLogger } from "../lib/pino.js";
import { installRequestLogging } from "../lib/request-logging.js";
import submissionsAdminController from "../submissionsAdmin/submissionsAdmin.controller.js";
import { BuildingSubmissionsNotDeclinedError, InvalidStatusTransitionError } from "../submissions/submissions.errors.js";
import { requestErrorHandler } from "./request-error-handler.js";
import { routeErrorHandler } from "./route-error-handler.js";

// Every 409, whether raised by a service rule or by a database conflict
// (request-guards.test.ts), carries status CONFLICT, and the request log
// classifies it the same way.
it("answers every 409 with status CONFLICT and logs it as CONFLICT", async (t) => {
  const lines: string[] = [];
  const stream = new Writable({ write(chunk, _encoding, done) { lines.push(chunk.toString()); done(); } });

  const database = {
    user: { upsert: async () => ({ id: "admin-1" }) },
    config: { findUnique: async () => ({ versionName: "v1", isActive: true }) },
  };
  const config = await configService.factory({
    services: { get: async () => database } as unknown as ServiceContainer,
  } as never);
  const services: Record<string, unknown> = {
    auth: {
      verifyRequest: async () => ({
        sub: "admin-1",
        resource_access: { "digital-energy-twin": { roles: ["admin"] } },
      }),
    },
    database,
    config,
    submissions: {
      accept: async () => { throw new InvalidStatusTransitionError("FREIGEGEBEN", "FREIGEGEBEN"); },
      deleteBuildingSubmissions: async () => { throw new BuildingSubmissionsNotDeclinedError("DEBY_1"); },
    },
  };
  const serviceRegistry = {
    initializeInstant: async () => undefined,
    resolve: () => ({ get: async (name: string) => services[name] }),
  } as unknown as ServiceRegistry;
  const controllerRegistry = new ControllerRegistry(serviceRegistry);
  controllerRegistry.register(submissionsAdminController);
  controllerRegistry.register(configController);

  const app = Fastify();
  installRequestLogging(app, createPrivacyLogger({ base: undefined }, stream));
  app.setErrorHandler(requestErrorHandler);
  await app.register(fastifyToab, {
    getRegistries: async () => ({ controllerRegistry, serviceRegistry, workerRegistry: {} as WorkerRegistry }),
    includeGenericErrorResponses: true,
    onRouteError: routeErrorHandler,
  });
  await app.ready();
  t.after(() => app.close());

  const headers = { authorization: "Bearer x" };
  const requests = [
    { method: "POST", url: "/api/admin/submissions/s1/accept", payload: {} },
    { method: "DELETE", url: "/api/admin/submissions/building/DEBY_1" },
    { method: "POST", url: "/api/admin/config", payload: { versionName: "v1", calculationConfig: "{}", subsidies: [] } },
    { method: "DELETE", url: "/api/admin/config/v1" },
  ] as const;

  for (const request of requests) {
    const response = await app.inject({ ...request, headers });
    assert.equal(response.statusCode, 409, request.url);
    const body = response.json();
    assert.equal(body.status, "CONFLICT", request.url);
    assert.equal(body.code, 409, request.url);
  }

  const records = lines.map((line) => JSON.parse(line)).filter((record) => record.event === "request_failed");
  assert.deepEqual(records.map((record) => [record.statusCode, record.errorCode]), requests.map(() => [409, "CONFLICT"]));
});
