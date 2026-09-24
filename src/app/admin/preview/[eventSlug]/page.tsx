/**
 * Preview Mode — tampilkan event seperti halaman publik meski masih Draft.
 * Hanya bisa diakses via /admin/preview/[slug] (route admin, perlu login).
 */
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Eye, ArrowLeft, Calendar, MapPin, Layers, Images } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { DayCard } from "@/components/gallery/DayCard";
import { EventStats } from "@/components/gallery/EventStats";
import { formatDateRange } from "@/lib/utils/date";
import { withAdminAuthServer } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ eventSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = await prisma.event.findUnique({ where: { slug: eventSlug }, select: { title: true } });
  return { title: event ? `[Preview] ${event.title}` : "Preview" };
}

export default async function PreviewPage({ params }: Props) {
  // Verify admin session
  const session = await withAdminAuthServer();
  if (!session) redirect("/admin/login");

  const { eventSlug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      _count: {
        select: {
          eventDays: true,
          mediaFiles: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

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
  const totalDays   = event._count.eventDays;
  const totalAlbums = eventDays.reduce((s, d) => s + d._count.albums, 0);
  const dateRange   = formatDateRange(event.startDate, event.endDate);

  return (
    <>
      <SiteHeader />

      {/* Preview Banner */}
      <div className="bg-purple-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
        <Eye size={14} />
        Mode Preview — halaman ini tidak terlihat publik
        <Link
          href={`/admin/dashboard/events/${event.id}`}
          className="ml-4 underline hover:no-underline flex items-center gap-1"
        >
          <ArrowLeft size={12} />
          Kembali ke Admin
        </Link>
      </div>

      <main className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-yellow-500 text-yellow-900 font-bold px-2 py-0.5 rounded uppercase">
                {event.status}
              </span>
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-300 mb-6">
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} />{event.location}
                  </span>
                )}
                {dateRange && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} />{dateRange}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {event.description}
                </p>
              )}
              <EventStats days={totalDays} albums={totalAlbums} photos={totalPhotos} />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Layers size={20} className="text-brand-600" />
            Event Days
          </h2>
          {eventDays.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Images size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada hari yang dibuat.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventDays.map((day) => (
                <DayCard key={day.id} day={day} eventSlug={event.slug} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
