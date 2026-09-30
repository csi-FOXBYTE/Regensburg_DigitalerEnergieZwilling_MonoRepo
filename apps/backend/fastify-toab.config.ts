import { defineConfig } from "@csi-foxbyte/fastify-toab";
import { Type } from "@sinclair/typebox";
import { routeErrorHandler } from "./src/errors/route-error-handler.js";

// fastify-toab 0.2.0-rc.4's CLI reads the module namespace, not its default export.
// Also export this setting by name so Pino's transport workers stay in node_modules.
export const rolldown = {
  external: ["pino"],
};

export default defineConfig({
  rolldown,
  env: Type.Object({
    AUTH_RESOURCE_ACCESS_CLIENT_ID: Type.Optional(Type.String()),
    DATABASE_URL: Type.String(),
    TILES_URL: Type.String({ minLength: 1 }),
    TERRAIN_URL: Type.String({ minLength: 1 }),
    ADDRESS_DATABASE_URL: Type.String({ minLength: 1 }),
    APP_BASE_URL: Type.String(),
    PUBLIC_CLIENT_BASE_URL: Type.String(),
    ADMIN_CLIENT_BASE_URL: Type.String(),
    PORT: Type.Optional(Type.String()),
    NODE_ENV: Type.Optional(Type.String()),
    KEYCLOAK_JWKS_URI: Type.String(),
  }),
  onRouteError: routeErrorHandler,
  onReady: async (fastify) => {
    if (!fastify.hasDecorator("swagger")) return;

    // fastify-toab documents handlers without an output body as 204. Public
    // feedback creation intentionally has no body but uses 201 instead.
    const document = fastify.swagger() as {
      paths?: Record<
        string,
        { post?: { responses?: Record<string, unknown> } }
      >;
    };
    const responses = document.paths?.["/api/public/feedback"]?.post?.responses;
    if (!responses) return;

    delete responses["204"];
    responses["201"] = { description: "Feedback created" };
  },
  fastify: () => ({
    underPressure: {
      exposeStatusRoute: "/health",
    },
    swagger: {
      openapi: {
        openapi: "3.1.0",
      },
    },
  }),
});
