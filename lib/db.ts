import { createDb } from "./db-client";
import { requireEnv } from "./env";

type Db = ReturnType<typeof createDb>;

let instance: Db | undefined;

function getDb(): Db {
  return (instance ??= createDb(requireEnv("DATABASE_URL")));
}

// Created on first use, so a missing DATABASE_URL fails the request that needs
// the database instead of the build that merely imports this module.
export const db = new Proxy({} as Db, {
  get(_target, property) {
    const real = getDb();
    const value: unknown = Reflect.get(real, property, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
