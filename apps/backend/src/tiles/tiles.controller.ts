import { createController } from "@csi-foxbyte/fastify-toab";
import { Type } from "@sinclair/typebox";

const tilesController = createController()
    .rootPath("/api/public/tiles");

tilesController
    .addRoute("GET", "/*")
    .output(Type.Null())
    .handler(async ({ request, reply }) => {
        const remaining = (request.params as Record<string, string>)["*"];
        reply.header("location", `${process.env.TILES_URL}/${remaining}`).code(302);
        return null;
    }, { schema: { hide: true } });

export default tilesController;
