import { createController } from "@csi-foxbyte/fastify-toab";
import { Type } from "@sinclair/typebox";

const terrainController = createController().rootPath("/api/public/terrain");

terrainController
  .addRoute("GET", "/*")
  .output(Type.Null())
  .handler(
    async ({ request, reply }) => {
      const remaining = (request.params as Record<string, string>)["*"];
      reply.header("location", `${process.env.TERRAIN_URL}/${remaining}`).code(302);
      return null;
    },
    { schema: { hide: true } },
  );

export default terrainController;
