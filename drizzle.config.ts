import type { Config } from "drizzle-kit";
import { env } from "@/lib/env.mjs";

export default {
  schema: "./lib/db/schema/*",
  driver: "pg",
  out: "./lib/db/migrations",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  }
} satisfies Config;