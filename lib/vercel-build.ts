export function shouldRunMigrations(
  env: Record<string, string | undefined>,
): boolean {
  return env.VERCEL === "1" && Boolean(env.DATABASE_URL);
}
