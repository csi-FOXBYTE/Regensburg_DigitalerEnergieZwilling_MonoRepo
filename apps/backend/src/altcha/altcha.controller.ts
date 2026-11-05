import { createController } from "@csi-foxbyte/fastify-toab";
import { getAltchaService } from "../@internals/index.js";
import { AltchaChallengeOutputDto } from "./altcha.dto.js";

const altchaController = createController().rootPath("/api/public/altcha");

// A new HMAC-signed proof-of-work challenge for the Altcha widget. Its
// solution goes in the X-Altcha header of the public write requests.
altchaController
  .addRoute("GET", "/challenge")
  .output(AltchaChallengeOutputDto)
  .handler(async ({ services, reply }) => {
    reply.header("Cache-Control", "no-store");
    const altcha = await getAltchaService(services);
    const { parameters, signature } = await altcha.createChallenge();
    const { keySignature, expiresAt } = parameters;
    if (!signature || !keySignature || expiresAt === undefined)
      throw new Error("Altcha challenge is incomplete");
    return { parameters: { ...parameters, keySignature, expiresAt }, signature };
  });

export default altchaController;
