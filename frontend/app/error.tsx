"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js App Router error boundary page.
 * Caught automatically when a page or layout throws during render.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <span className="text-6xl mb-6 block select-none" aria-hidden="true">
          😕
        </span>
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500 mt-2">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-sm font-semibold transition-colors text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
