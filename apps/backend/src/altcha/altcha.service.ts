import { createService } from "../toab/index.js";
import { getAltcha } from "./altcha.js";

// The same instance as the request guard installed in fastify-toab.config.ts.
const altchaService = createService("altcha", async () => getAltcha());

export default altchaService;
