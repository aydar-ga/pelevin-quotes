import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
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
    return drizzleServerless(pool, { schema });
  }

  const sql = neon(connectionString);
  return drizzleHttp(sql, { schema });
}
