import AjvCompiler from "@fastify/ajv-compiler";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error.js";

// The deepest legitimate body (submission input with a year range) has five
// levels. Deeper structures only cost stack and CPU further down the line.
export const MAX_BODY_DEPTH = 32;

const badRequest = (message: string) =>
  new AppError({ status: "BAD_REQUEST", code: 400, message });

const isContainer = (value: unknown): value is object => {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return true;
  // Only parsed JSON and query objects (fast-querystring's have a prototype
  // without a prototype); never walk Buffers or streams.
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null || Object.getPrototypeOf(prototype) === null;
};

type Violation = "too_deep" | "nul_character" | "non_finite_number";

// Iterative, so a hostile structure cannot exhaust the stack here either.
export function findViolation(
  value: unknown,
  { maxDepth = Infinity, finiteNumbers = false } = {},
): Violation | undefined {
  const pending: [unknown, number][] = [[value, 1]];
  while (pending.length > 0) {
    const [current, depth] = pending.pop()!;
    if (typeof current === "string") {
      if (current.includes("\u0000")) return "nul_character";
    } else if (typeof current === "number") {
      if (finiteNumbers && !Number.isFinite(current)) return "non_finite_number";
    } else if (isContainer(current)) {
      if (depth > maxDepth) return "too_deep";
      for (const [key, child] of Object.entries(current)) {
        if (key.includes("\u0000")) return "nul_character";
        pending.push([child, depth + 1]);
      }
    }
  }
  return undefined;
}

const messages: Record<Violation, string> = {
  too_deep: `Request body must not be nested deeper than ${MAX_BODY_DEPTH} levels`,
  nul_character: "Request must not contain NUL characters",
  non_finite_number: "Numeric parameters must be finite",
};

const assertValid = (value: unknown, options?: Parameters<typeof findViolation>[1]) => {
  const violation = findViolation(value, options);
  if (violation) throw badRequest(messages[violation]);
};

// Fastify's Ajv defaults would coerce types (e.g. the number 12345 into the
// string "12345") and silently drop properties that a schema declares as
// additional. Here, an unknown property is rejected with 400, like any other
// invalid value, and JSON bodies must already carry the declared types; query
// strings and path parameters are text and keep their coercion.
const buildCompiler = AjvCompiler();
type CompilerOptions = NonNullable<Parameters<typeof buildCompiler>[1]>;
type ExternalSchemas = Parameters<typeof buildCompiler>[0];
type RouteDefinition = { httpPart?: string };

export const buildValidator = (externalSchemas: ExternalSchemas, options?: CompilerOptions) => {
  const build = (customOptions: Record<string, unknown>) =>
    buildCompiler(externalSchemas, {
      ...options,
      customOptions: { ...options?.customOptions, removeAdditional: false, ...customOptions },
    } as CompilerOptions);
  const coercing = build({});
  const strict = build({ coerceTypes: false });
  return (route: RouteDefinition) =>
    (route.httpPart === "body" ? strict : coercing)(route as never);
};

// RFC 8259 JSON is UTF-8; a body declared in another charset would be
// decoded as UTF-8 anyway and stored differently from what the client meant.
export function hasNonUtf8JsonCharset(contentType: string | undefined): boolean {
  if (!contentType) return false;
  const [mediaType = "", ...parameters] = contentType.split(";");
  const type = mediaType.trim().toLowerCase();
  if (type !== "application/json" && !type.endsWith("+json")) return false;
  return parameters.some((parameter) => {
    const [name = "", value = ""] = parameter.split("=");
    if (name.trim().toLowerCase() !== "charset") return false;
    const charset = value.trim().replace(/^"(.*)"$/, "$1").toLowerCase();
    return charset !== "utf-8" && charset !== "utf8";
  });
}

// Rejects input that is syntactically valid but would only fail later with a
// 500: PostgreSQL text columns reject U+0000, JSON.stringify and the
// calculation recurse into deeply nested values, and Ajv lets "Infinity" or
// "1e400" through numeric query parameters.
export function installRequestGuards(fastify: FastifyInstance) {
  fastify.setSchemaController({
    compilersFactory: { buildValidator: buildValidator as never },
  });

  fastify.addHook("preParsing", async (request: FastifyRequest) => {
    if (hasNonUtf8JsonCharset(request.headers["content-type"]))
      throw new AppError({
        status: "UNSUPPORTED_MEDIA_TYPE",
        code: 415,
        message: "JSON request bodies must be UTF-8",
      });
  });

  fastify.addHook("preValidation", async (request: FastifyRequest) => {
    assertValid(request.body, { maxDepth: MAX_BODY_DEPTH });
    assertValid(request.query);
    assertValid(request.params);
  });

  // After validation, when query and path values have been coerced.
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    assertValid(request.query, { finiteNumbers: true });
    assertValid(request.params, { finiteNumbers: true });
  });
}
