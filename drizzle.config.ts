import type { Config } from "drizzle-kit";
import { env } from "@/lib/env.mjs";

// Parse connection string to get individual credentials
const connectionString = new URL(env.DATABASE_URL);
const [username, password] = connectionString.username ? [connectionString.username, connectionString.password] : [undefined, undefined];
const database = connectionString.pathname.slice(1);

export default {
  schema: "./lib/db/schema/*",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: connectionString.hostname,
    port: parseInt(connectionString.port || "5432"),
    user: username,
    password: password,
    database: database,
    ssl: env.DATABASE_URL.includes("sslmode=require") ? "require" : false,
  },
  verbose: true,
  strict: true,
} satisfies Config;