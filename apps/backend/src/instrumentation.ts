import type { InstrumentationInput } from "@csi-foxbyte/fastify-toab";
import { analyticsConfigState } from "./config/matomo.js";
import { injectPinoLogger, logEvent } from "./lib/pino.js";
import { installRequestLogging } from "./lib/request-logging.js";

// Install before startServer() validates the environment or creates Fastify.
injectPinoLogger();

export default async function ({ fastify }: InstrumentationInput) {
  installRequestLogging(fastify);
  // A misspelled MATOMO_SITE_ID would otherwise switch analytics off silently.
  fastify.addHook("onListen", async () => {
    logEvent({ event: "analytics_config", state: analyticsConfigState() });
  });
}
