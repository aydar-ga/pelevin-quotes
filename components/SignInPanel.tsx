"use client";

import SignInForm from "./SignInForm";
import SidePanel from "./SidePanel";

interface SignInPanelProps {
  open: boolean;
  onClose: () => void;
  callbackURL?: string;
  hint?: string;
}

export default function SignInPanel({
  open,
  onClose,
  callbackURL = "/?welcome=1",
  hint,
}: SignInPanelProps) {
  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Вход"
      titleId="sign-in-panel-title"
      hint={hint}
    >
      <div className="overflow-y-auto px-6 py-5">
        <SignInForm callbackURL={callbackURL} />
        {process.env.NEXT_PUBLIC_DEV_TEST_AUTH === "true" && (
          <p className="mt-6 text-center">
            <a
              href="/dev/login"
              className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
            >
              Dev: войти как тестовый пользователь
            </a>
          </p>
        )}
      </div>
    </SidePanel>
  );
}
