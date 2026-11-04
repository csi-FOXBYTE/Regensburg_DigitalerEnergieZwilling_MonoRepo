import type { FastifyInstance } from "fastify";

// Fastify's default 404 echoes the method and full URL. Old PDF links carry the
// deletion token in the path, so the response must not repeat the URL.
export function installNotFoundHandler(fastify: FastifyInstance) {
  fastify.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ status: "NOT_FOUND", message: "Not found" });
  });
}
