"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className="rounded-md border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:opacity-80"
    >
      Выйти
    </button>
  );
}
