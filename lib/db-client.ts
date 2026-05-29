import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function isLocalPostgresUrl(connectionString: string) {
  try {
    const host = new URL(
      connectionString.replace(/^postgres:/, "postgresql:"),
    ).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export function createDb(connectionString: string) {
  if (isLocalPostgresUrl(connectionString)) {
    const pool = new Pool({ connectionString });
    return drizzleNodePostgres(pool, { schema });
  }

  const sql = neon(connectionString);
  return drizzleHttp(sql, { schema });
}
