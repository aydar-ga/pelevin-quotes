"use client";

import { X } from "lucide-react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  hint?: string;
  children: React.ReactNode;
}

export default function SidePanel({
  open,
  onClose,
  title,
  titleId,
  hint,
  children,
}: SidePanelProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-slide-in fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--card-border)] bg-[var(--background)] shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--card-border)] px-6 py-5">
          <div>
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight text-[var(--foreground)]"
            >
              {title}
            </h2>
            {hint && (
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {hint}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Закрыть панель"
            onClick={onClose}
            className="rounded-full border border-[var(--card-border)] p-2 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </aside>
    </>
  );
}
