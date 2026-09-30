import type { InstrumentationInput } from "@csi-foxbyte/fastify-toab";
import { injectPinoLogger } from "./lib/pino.js";
import { installRequestLogging } from "./lib/request-logging.js";

// Install before startServer() validates the environment or creates Fastify.
injectPinoLogger();

export default async function ({ fastify }: InstrumentationInput) {
  installRequestLogging(fastify);
}
