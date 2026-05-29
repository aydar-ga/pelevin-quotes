import { execSync } from "node:child_process";
import { shouldRunMigrations } from "../lib/vercel-build";

if (shouldRunMigrations(process.env)) {
  console.log(`[vercel-build] Running Drizzle migrations (${process.env.VERCEL_ENV ?? "unknown"})…`);
  execSync("npm run db:migrate", { stdio: "inherit" });
} else {
  console.log("[vercel-build] Skipping migrations (not a Vercel build with DATABASE_URL).");
}

execSync("npm run build", { stdio: "inherit" });
