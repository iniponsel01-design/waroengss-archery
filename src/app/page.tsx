import Link from "next/link";
import { eventRepository } from "@/repositories/event.repository";
import { prisma } from "@/lib/db/client";
import { EventCard } from "@/components/gallery/EventCard";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { BannerSlider } from "@/components/shared/BannerSlider";
import { AdBlock } from "@/components/shared/AdBlock";
import { config } from "@/config";

export const revalidate = 60;

export default async function HomePage() {
  const [{ data: events }, bannersTop, bannersBottom, adSlots] = await Promise.all([
    eventRepository.listPublished({ page: 1, pageSize: 12 }),
    prisma.banner.findMany({
      where: { isActive: true, position: "HOME_TOP" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.banner.findMany({
      where: { isActive: true, position: "HOME_BOTTOM" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.adSlot.findMany({
      where: { isActive: true, position: "HOME_BOTTOM" },
    }),
  ]);

  const homeBottomAd = adSlots[0] ?? null;

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-repeat opacity-20" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
            <p className="text-brand-400 text-sm font-semibold tracking-widest uppercase mb-4">
              {config.app.brandName}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
              Event Documentation
              <br />
              <span className="text-brand-400">Gallery</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
              Temukan, lihat, dan unduh foto dokumentasi event dengan mudah.
              Tidak perlu login, langsung akses.
            </p>
            {events.length > 0 && (
              <Link
                href={`/e/${events[0].slug}`}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
              >
                Lihat Event Terbaru
              </Link>
            )}
          </div>
        </section>

        {/* Banner Promosi — TOP */}
        {bannersTop.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pt-6">
            <BannerSlider banners={bannersTop} dismissable />
          </div>
        )}

        {/* Events Grid */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Event Terbaru</h2>
            <span className="text-sm text-gray-500">{events.length} event</span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-lg">Belum ada event yang dipublikasikan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Banner Promosi — BOTTOM */}
        {bannersBottom.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-6">
            <BannerSlider banners={bannersBottom} autoPlayMs={7000} dismissable />
          </div>
        )}

        {/* AdSense Block — HOME_BOTTOM */}
        {homeBottomAd && (
          <div className="max-w-6xl mx-auto px-4 pb-8">
            <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
            <AdBlock
              adClient={homeBottomAd.adClient}
              adSlot={homeBottomAd.adSlot}
              adFormat={homeBottomAd.adFormat}
              className="w-full"
            />
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
