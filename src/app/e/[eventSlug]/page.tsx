import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, Layers, Images, Search } from "lucide-react";
import { eventRepository } from "@/repositories/event.repository";
import { prisma } from "@/lib/db/client";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { DayCard } from "@/components/gallery/DayCard";
import { EventStats } from "@/components/gallery/EventStats";
import { formatDateRange } from "@/lib/utils/date";
import { PageBannersTop, PageBannersBottom } from "@/components/shared/PageBanners";

export const revalidate = 30;

interface Props {
  params: Promise<{ eventSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) return {};

  return {
    title: event.seoTitle || event.title,
    description:
      event.seoDescription ||
      `Dokumentasi foto ${event.title}${event.location ? ` di ${event.location}` : ""}`,
    openGraph: {
      title: event.seoTitle || event.title,
      description: event.seoDescription || "",
      images: event.ogImageUrl ? [event.ogImageUrl] : [],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { eventSlug } = await params;
  const event = await eventRepository.findPublishedBySlug(eventSlug);

  if (!event) notFound();

  const eventDays = await prisma.eventDay.findMany({
    where: { eventId: event.id, status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          albums: { where: { status: "ACTIVE" } },
          mediaFiles: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  const totalPhotos = event._count.mediaFiles;
  const totalDays = event._count.eventDays;
  const totalAlbums = eventDays.reduce((sum, day) => sum + day._count.albums, 0);
  const dateRange = formatDateRange(event.startDate, event.endDate);

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-gray-50">
        {/* Event Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            <nav className="text-sm text-gray-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-200">{event.title}</span>
            </nav>

            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-gray-300 mb-6">
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} />
                    {event.location}
                  </span>
                )}
                {dateRange && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} />
                    {dateRange}
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {event.description}
                </p>
              )}

              <EventStats
                days={totalDays}
                albums={totalAlbums}
                photos={totalPhotos}
              />

              {/* Search link */}
              <div className="mt-6">
                <Link
                  href={`/e/${eventSlug}/search`}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl transition-colors"
                >
                  <Search size={15} />
                  Cari Foto
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Banner Event TOP */}
        <PageBannersTop position="EVENT_TOP" className="max-w-6xl mx-auto px-4 pt-6" />

        {/* Event Days */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Layers size={20} className="text-brand-600" />
            Event Days
          </h2>

          {eventDays.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Images size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Foto sedang diproses
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Tim dokumentasi masih mengunggah foto. Silakan cek kembali beberapa saat lagi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventDays.map((day) => (
                <DayCard key={day.id} day={day} eventSlug={eventSlug} />
              ))}
            </div>
          )}
        </section>

        {/* Banner + Iklan EVENT BOTTOM */}
        <PageBannersBottom
          bannerPosition="EVENT_BOTTOM"
          adPosition="EVENT_BOTTOM"
          className="max-w-6xl mx-auto px-4 pb-8 space-y-4"
        />
      </main>

      <SiteFooter />
    </>
  );
}
