import { createController } from "@csi-foxbyte/fastify-toab";
import { authMiddleware } from "./auth.middleware.js";
import { VerifyAuthOutputDto } from "./auth.dto.js";

const authController = createController()
  .use(authMiddleware)
  .rootPath("/api/admin/auth");

authController
  .addRoute("GET", "/verify")
  .output(VerifyAuthOutputDto)
  .handler(async ({ ctx }) => {
    return { accessToken: ctx.token };
  });

export default authController;
