import type { Metadata } from "next";
import Link from "next/link";
import { Camera, FolderOpen, Download, QrCode, Shield } from "lucide-react";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Waroeng SS Archery Gallery — platform dokumentasi foto event panahan yang dikembangkan oleh Nusantara Android Studio.",
  robots: { index: true, follow: true },
};

const features = [
  {
    icon: Camera,
    title: "Dokumentasi Event",
    desc: "Foto dokumentasi setiap event panahan tersimpan rapi per hari dan per album.",
  },
  {
    icon: FolderOpen,
    title: "Akses Tanpa Login",
    desc: "Semua pengunjung bisa melihat dan mencari foto tanpa perlu membuat akun.",
  },
  {
    icon: Download,
    title: "Unduh Foto",
    desc: "Peserta dan penonton dapat mengunduh foto langsung dari galeri.",
  },
  {
    icon: QrCode,
    title: "QR Code Event",
    desc: "Setiap event memiliki QR code yang bisa dipasang di venue untuk akses cepat.",
  },
  {
    icon: Shield,
    title: "Aman & Terpercaya",
    desc: "Data tersimpan di Supabase PostgreSQL, foto dihosting di Google Drive.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-brand-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Tentang Platform
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Waroeng SS Archery Gallery
            </h1>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              Platform dokumentasi foto event panahan — temukan, lihat, dan unduh
              foto tanpa perlu login.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">

          {/* About */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Apa Itu Platform Ini?</h2>
            <p className="text-gray-600 leading-relaxed">
              Waroeng SS Archery Gallery adalah platform digital yang dirancang khusus
              untuk mendokumentasikan setiap event panahan Waroeng SS Archery. Platform
              ini memudahkan peserta, penonton, dan keluarga untuk mengakses dan mengunduh
              foto dari event yang mereka ikuti — kapan saja dan di mana saja.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Foto diorganisir per event, per hari, dan per album sehingga mudah ditemukan.
              Setiap event juga dilengkapi QR code yang bisa dipindai langsung dari venue.
            </p>
          </div>

          {/* Features */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Fitur Platform</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4"
                >
                  <div className="shrink-0 w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                    <Icon size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm mb-1">{title}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Developer */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Dikembangkan Oleh</h2>
            <p className="text-gray-600 leading-relaxed">
              Platform ini dikembangkan dan dikelola oleh{" "}
              <strong>Nusantara Android Studio</strong>, studio pengembang aplikasi
              dan platform digital yang berbasis di Indonesia.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="mailto:lencakstudio@gmail.com"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Hubungi Kami
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Form Kontak
              </Link>
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
