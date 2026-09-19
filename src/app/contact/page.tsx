import type { Metadata } from "next";
import { Mail, Instagram, Facebook, Youtube, Globe } from "lucide-react";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getBranding } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi tim Waroeng SS Archery Gallery untuk pertanyaan, saran, atau kerja sama.",
  robots: { index: true, follow: true },
};

export default async function ContactPage() {
  const branding = await getBranding();

  const socials = [
    { href: branding.socialInstagram, icon: Instagram, label: "Instagram", handle: branding.socialInstagram?.replace("https://www.instagram.com/", "@").replace("https://instagram.com/", "@") },
    { href: branding.socialFacebook,  icon: Facebook,  label: "Facebook",  handle: "Waroeng SS Archery" },
    { href: branding.socialYoutube,   icon: Youtube,   label: "YouTube",   handle: branding.socialYoutube?.replace("https://www.youtube.com/@", "@") },
    { href: branding.brandWebsite,    icon: Globe,     label: "Website",   handle: branding.brandWebsite },
  ].filter((s) => !!s.href);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-16">

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hubungi Kami</h1>
            <p className="text-gray-500">
              Ada pertanyaan, saran, atau permintaan khusus? Jangan ragu untuk menghubungi kami.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Email */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:col-span-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={22} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 mb-1">Email</h2>
                  <p className="text-gray-500 text-sm mb-3">
                    Untuk pertanyaan teknis, permintaan penghapusan foto, atau kerja sama,
                    kirimkan email ke:
                  </p>
                  <a
                    href="mailto:lencakstudio@gmail.com"
                    className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                  >
                    <Mail size={15} />
                    lencakstudio@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Social Media */}
            {socials.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:col-span-2">
                <h2 className="font-bold text-gray-900 mb-4">Media Sosial</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {socials.map(({ href, icon: Icon, label, handle }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-gray-100 group-hover:bg-brand-100 rounded-lg flex items-center justify-center transition-colors">
                        <Icon size={16} className="text-gray-500 group-hover:text-brand-600 transition-colors" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-brand-700 transition-colors">
                          {handle || href}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Pengelola */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:col-span-2">
              <h2 className="font-bold text-gray-900 mb-3">Informasi Pengelola</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="text-gray-400">Platform:</span> Waroeng SS Archery Gallery</p>
                <p><span className="text-gray-400">Dikelola oleh:</span> Nusantara Android Studio</p>
                <p><span className="text-gray-400">Email:</span> lencakstudio@gmail.com</p>
                <p><span className="text-gray-400">Website:</span> archery.waroengss.com</p>
              </div>
            </div>

          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
