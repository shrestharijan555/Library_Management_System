import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Singleton pattern for database client in serverless/Next.js environment
declare global {
  var __db: PostgresJsDatabase<typeof schema> | undefined;
}

function createDbClient() {
  const conn = process.env.DATABASE_URL || "";
  if (!conn) {
    // Return a dummy/lazy initialized instance during builds when DATABASE_URL is not set
    const fallbackClient = postgres("postgres://postgres:postgres@localhost:5432/placeholder", {
      max: 1,
      connect_timeout: 1,
      prepare: false,
      idle_timeout: 1,
    });
    return drizzle(fallbackClient, { schema });
  }

  const isLocal = conn.includes("localhost") || conn.includes("127.0.0.1");
  const queryClient = postgres(conn, {
    prepare: false,
    ssl: isLocal ? false : "require",
  });

  return drizzle(queryClient, { schema });
}

export const db = global.__db || createDbClient();

if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}

export * from "./schema";
