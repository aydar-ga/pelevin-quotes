"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mt-4 flex w-full max-w-md items-start gap-3 rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-[var(--error-fg)]"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">Что-то пошло не так</p>
        <p className="opacity-90">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1 rounded-md border border-[var(--error-border)] px-2 py-1 text-xs font-medium hover:opacity-80"
        >
          <RefreshCw className="h-3 w-3" />
          Ещё раз
        </button>
      )}
    </div>
  );
}
