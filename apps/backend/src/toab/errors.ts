// Derived from @csi-foxbyte/fastify-toab 0.2.0-rc.4 (src/errors.ts), LGPL-3.0-or-later,
// https://github.com/csi-FOXBYTE/fastify-toab. Modified for this backend, see NOTICE.
import { Type, type TSchema } from "@sinclair/typebox";

// Only the documented error response schemas are kept. The original
// GenericRouteError sent stack traces to clients; this backend answers errors
// through onRouteError (src/errors/route-error-handler.ts) instead.
function createErrorResponseOpenAPI(description: string, errorCode: number) {
  return Type.Object(
    {
      status: Type.String(),
      message: Type.String(),
      payload: Type.Optional(Type.Any()),
      internal: Type.Optional(
        Type.Object({
          stack: Type.Optional(Type.String()),
          cause: Type.Optional(Type.String()),
        })
      ),
    },
    { description, $id: `ERROR_${errorCode}` }
  );
}

export const fastifyGenericErrorResponsesSchemas: Record<number, TSchema> = {
  400: createErrorResponseOpenAPI("Bad request, input malformed.", 400),
  401: createErrorResponseOpenAPI("Unauthorized", 401),
  403: createErrorResponseOpenAPI("Forbidden", 403),
  404: createErrorResponseOpenAPI("Not found", 404),
  405: createErrorResponseOpenAPI("Method not allowed", 405),
  500: createErrorResponseOpenAPI("Internal server error", 500),
};

export const fastifyGenericErrorResponsesRefs = {
  400: { $ref: "ERROR_400" },
  401: { $ref: "ERROR_401" },
  403: { $ref: "ERROR_403" },
  404: { $ref: "ERROR_404" },
  405: { $ref: "ERROR_405" },
  500: { $ref: "ERROR_500" },
};
