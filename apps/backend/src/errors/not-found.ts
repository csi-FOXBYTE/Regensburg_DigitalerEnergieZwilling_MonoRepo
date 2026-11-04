import type { FastifyInstance } from "fastify";
import { AppError, sendAppError } from "./app-error.js";

// Fastify's default 404 echoes the method and full URL. Old PDF links carry the
// deletion token in the path, so the response must not repeat the URL.
export function installNotFoundHandler(fastify: FastifyInstance) {
  fastify.setNotFoundHandler((_request, reply) => {
    sendAppError(reply, new AppError({ status: "NOT_FOUND", code: 404, message: "Not found" }));
  });
}
