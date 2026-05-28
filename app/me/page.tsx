import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export const metadata = {
  title: "Профиль — Цитатки из Пелевина",
};

export default async function MePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4 text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-[var(--muted)]">Ты вошёл как</p>
        <p
          data-testid="signed-in-email"
          className="mt-1 text-lg font-semibold break-all"
        >
          {session.user.email}
        </p>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
