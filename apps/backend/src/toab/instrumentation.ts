// Derived from @csi-foxbyte/fastify-toab 0.2.0-rc.4 (src/instrumentation.ts), LGPL-3.0-or-later,
// https://github.com/csi-FOXBYTE/fastify-toab. Modified for this backend, see NOTICE.
import type { FastifyInstance } from "fastify";
import type { Registries } from "./config.js";

export type InstrumentationInput = { fastify: FastifyInstance, registries: Registries };
