import { createController } from "@csi-foxbyte/fastify-toab";
import { Type } from "@sinclair/typebox";
import { authMiddlewareWithRoles } from "../auth/auth.middleware.js";

const testController = createController()
  .use(authMiddlewareWithRoles(["admin"]))
  .rootPath("/api/admin/test");

testController
  .addRoute("GET", "/")
  .output(Type.Any())
  .handler(async () => {
    return { Hallo: "Welt!" };
  });

export default testController;
