import Link from "next/link";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-8xl font-bold text-gray-100 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Halaman tidak ditemukan
          </h2>
          <p className="text-gray-500 mb-8">
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
