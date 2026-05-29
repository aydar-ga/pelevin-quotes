import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--muted)]">
          Загружаем…
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
