import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  ControllerRegistry,
  fastifyToab,
  type ServiceContainer,
  type ServiceRegistry,
  type WorkerRegistry,
} from "@csi-foxbyte/fastify-toab";
import Fastify from "fastify";
import configController from "./config.controller.js";

const previousTerrainUrl = process.env.TERRAIN_URL;
const previousTilesUrl = process.env.TILES_URL;
const previousAddressDatabaseUrl = process.env.ADDRESS_DATABASE_URL;

before(() => {
  process.env.TERRAIN_URL = "https://storage.example/terrain///";
  process.env.TILES_URL = "https://storage.example/tiles///";
  process.env.ADDRESS_DATABASE_URL =
    "https://storage.example/det-rg-addresses.sqlite";
});

after(() => {
  if (previousTerrainUrl === undefined)
    Reflect.deleteProperty(process.env, "TERRAIN_URL");
  else process.env.TERRAIN_URL = previousTerrainUrl;

  if (previousTilesUrl === undefined)
    Reflect.deleteProperty(process.env, "TILES_URL");
  else process.env.TILES_URL = previousTilesUrl;

  if (previousAddressDatabaseUrl === undefined)
    Reflect.deleteProperty(process.env, "ADDRESS_DATABASE_URL");
  else process.env.ADDRESS_DATABASE_URL = previousAddressDatabaseUrl;
});

async function createTestApp() {
  const serviceContainer: ServiceContainer = {
    get: async () => {
      throw new Error("No services used in map resources route tests");
    },
  };
  const serviceRegistry = {
    initializeInstant: async () => undefined,
    resolve: () => serviceContainer,
  } as unknown as ServiceRegistry;
  const controllerRegistry = new ControllerRegistry(serviceRegistry);
  controllerRegistry.register(configController);
  const workerRegistry = {
    getWorker: () => {
      throw new Error("No workers used in map resources route tests");
    },
    getQueue: () => {
      throw new Error("No queues used in map resources route tests");
    },
  } as unknown as WorkerRegistry;

  const app = Fastify();
  await app.register(fastifyToab, {
    getRegistries: async () => ({
      controllerRegistry,
      serviceRegistry,
      workerRegistry,
    }),
  });
  await app.ready();
  return app;
}

describe("map resources route", () => {
  it("returns normalized Cesium resource base URLs", async (t) => {
    const app = await createTestApp();
    t.after(() => app.close());

    const response = await app.inject({
      method: "GET",
      url: "/api/public/map-resources",
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], "public, max-age=300");
    assert.deepEqual(response.json(), {
      terrainBaseUrl: "https://storage.example/terrain/",
      tilesBaseUrl: "https://storage.example/tiles/",
      addressDatabaseUrl:
        "https://storage.example/det-rg-addresses.sqlite",
    });

    process.env.TERRAIN_URL = "/api/public/terrain";
    process.env.TILES_URL = "/api/public/tiles";
    process.env.ADDRESS_DATABASE_URL = "/det-rg-addresses.sqlite";
    const relativeResponse = await app.inject({
      method: "GET",
      url: "/api/public/map-resources",
    });

    assert.equal(relativeResponse.statusCode, 200);
    assert.deepEqual(relativeResponse.json(), {
      terrainBaseUrl: "/api/public/terrain/",
      tilesBaseUrl: "/api/public/tiles/",
      addressDatabaseUrl: "/det-rg-addresses.sqlite",
    });
  });
});
