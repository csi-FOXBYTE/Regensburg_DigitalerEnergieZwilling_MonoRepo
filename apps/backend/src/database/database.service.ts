import { createService } from "@csi-foxbyte/fastify-toab";
import { ZenStackClient } from "@zenstackhq/orm";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import { Pool } from "pg";
import { schema } from "../zenstack/schema.js";

const databaseService = createService("database", async () => {
  const client = new ZenStackClient(schema, {
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  return client;
});

export default databaseService;
