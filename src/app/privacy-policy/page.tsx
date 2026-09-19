import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Kebijakan privasi Waroeng SS Archery Gallery — cara kami mengumpulkan, menggunakan, dan melindungi data Anda.",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "19 September 2026";

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Terakhir diperbarui: {lastUpdated}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Tentang Platform Ini</h2>
              <p>
                Waroeng SS Archery Gallery (<strong>archery.waroengss.com</strong>) adalah platform
                dokumentasi foto event panahan yang dikelola oleh <strong>Nusantara Android Studio</strong>.
                Platform ini memungkinkan pengunjung melihat dan mengunduh foto dokumentasi event
                tanpa perlu membuat akun.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Data yang Kami Kumpulkan</h2>
              <p className="mb-3">Kami mengumpulkan data seminimal mungkin. Berikut data yang mungkin dikumpulkan:</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>
                  <strong>Data penggunaan otomatis</strong> — informasi teknis seperti jenis browser,
                  sistem operasi, halaman yang dikunjungi, dan waktu kunjungan. Data ini dikumpulkan
                  secara anonim melalui layanan analitik.
                </li>
                <li>
                  <strong>Cookie</strong> — kami menggunakan cookie fungsional untuk menjaga performa
                  website dan cookie dari Google AdSense untuk menampilkan iklan yang relevan.
                </li>
                <li>
                  <strong>Data unduhan</strong> — kami mencatat aktivitas unduhan foto secara anonim
                  untuk keperluan statistik internal.
                </li>
              </ul>
              <p className="mt-3 text-sm text-gray-500">
                Kami <strong>tidak</strong> mengumpulkan nama, email, nomor telepon, atau informasi
                identitas pribadi dari pengunjung umum.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. Penggunaan Data</h2>
              <p className="mb-3">Data yang dikumpulkan digunakan untuk:</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Meningkatkan performa dan pengalaman penggunaan website</li>
                <li>Memahami halaman dan konten yang paling banyak dikunjungi</li>
                <li>Mendeteksi dan mencegah penyalahgunaan layanan</li>
                <li>Menampilkan iklan yang relevan melalui Google AdSense</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. Google AdSense & Cookie Pihak Ketiga</h2>
              <p className="mb-3">
                Platform ini menggunakan <strong>Google AdSense</strong> untuk menampilkan iklan.
                Google menggunakan cookie untuk menayangkan iklan berdasarkan kunjungan sebelumnya
                ke website ini atau website lain.
              </p>
              <p className="mb-3 text-sm">
                Anda dapat menonaktifkan penggunaan cookie personalisasi Google dengan mengunjungi{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline"
                >
                  Google Ads Settings
                </a>.
              </p>
              <p className="text-sm">
                Untuk informasi lebih lanjut tentang kebijakan privasi Google, kunjungi{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline"
                >
                  policies.google.com/privacy
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. Foto dan Konten</h2>
              <p>
                Foto yang ditampilkan di platform ini merupakan dokumentasi event panahan Waroeng SS
                Archery. Hak cipta foto tetap menjadi milik penyelenggara event. Foto dapat diunduh
                untuk keperluan pribadi dan non-komersial. Penggunaan komersial memerlukan izin
                tertulis dari pengelola.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. Keamanan Data</h2>
              <p>
                Kami menerapkan langkah-langkah keamanan teknis yang wajar untuk melindungi data
                dari akses tidak sah, termasuk enkripsi HTTPS, autentikasi JWT untuk area admin,
                dan penyimpanan credentials yang aman.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. Perubahan Kebijakan</h2>
              <p>
                Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan akan
                ditandai dengan memperbarui tanggal &quot;Terakhir diperbarui&quot; di bagian atas halaman ini.
                Penggunaan website secara berkelanjutan setelah perubahan berarti Anda menyetujui
                kebijakan yang diperbarui.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded-xl text-sm space-y-1">
                <p><strong>Nusantara Android Studio</strong></p>
                <p>Email: <a href="mailto:lencakstudio@gmail.com" className="text-brand-600">lencakstudio@gmail.com</a></p>
                <p>Website: <a href="https://archery.waroengss.com" className="text-brand-600">archery.waroengss.com</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
