"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring service in production
    console.error("App error:", error.digest);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Terjadi kesalahan
        </h2>
        <p className="text-gray-500 mb-8">
          Maaf, terjadi kesalahan sementara. Silakan coba lagi.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
