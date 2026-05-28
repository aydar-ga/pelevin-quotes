import SignInForm from "@/components/SignInForm";
import PelevinIcon from "@/components/PelevinIcon";

export const metadata = {
  title: "Вход — Цитатки из Пелевина",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4">
      <div className="mb-6 flex items-center gap-4 text-[var(--foreground)]">
        <PelevinIcon size={56} />
        <h1 className="text-3xl font-bold md:text-4xl">Вход</h1>
      </div>
      <SignInForm />
    </main>
  );
}
