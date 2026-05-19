"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // hook for Sentry / etc. later
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[640px] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-bold">Something broke.</h1>
      <p className="text-sm text-white/60">
        {error?.message ?? "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="rounded-2xl bg-gradient-to-r from-orange-400 to-fuchsia-500 px-5 py-2 text-sm font-bold text-black"
      >
        Try again
      </button>
    </main>
  );
}
