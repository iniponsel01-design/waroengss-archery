import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Suspense } from "react";
import { eventRepository } from "@/repositories/event.repository";
import { prisma } from "@/lib/db/client";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SearchResults } from "@/components/gallery/SearchResults";
import { PageBannersTop } from "@/components/shared/PageBanners";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { eventSlug } = await params;
  const { q } = await searchParams;
  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) return {};
  return {
    title: q ? `Hasil pencarian "${q}" — ${event.title}` : `Cari Foto — ${event.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { eventSlug } = await params;
  const { q, day, album: albumFilter, page } = await searchParams;

  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) notFound();

  // Get all days for filter
  const days = await prisma.eventDay.findMany({
    where: { eventId: event.id, status: "ACTIVE" },
    select: { id: true, dayNumber: true, title: true },
    orderBy: { sortOrder: "asc" },
  });

  // Get all albums for filter
  const albums = await prisma.album.findMany({
    where: {
      status: "ACTIVE",
      eventDay: { eventId: event.id, status: "ACTIVE" },
    },
    select: { id: true, name: true, slug: true, eventDayId: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-950">
        {/* Header */}
        <section className="bg-gray-900 text-white border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <nav className="text-sm text-gray-400 mb-3">
              <Link href={`/e/${eventSlug}`} className="hover:text-white transition-colors">
                {event.title}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-200">Cari Foto</span>
            </nav>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search size={22} className="text-brand-400" />
              {q ? `Hasil: "${q}"` : "Cari Foto"}
            </h1>
          </div>
        </section>

        {/* Banner SEARCH TOP */}
        <PageBannersTop position="SEARCH_TOP" className="max-w-7xl mx-auto px-4 pt-4" />

        {/* Search Results */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-500">Memuat...</div>}>
            <SearchResults
              eventId={event.id}
              eventSlug={eventSlug}
              query={q}
              dayFilter={day}
              albumFilter={albumFilter}
              page={page ? parseInt(page) : 1}
              days={days}
              albums={albums}
            />
          </Suspense>
        </section>
      </main>
      <SiteFooter dark />
    </>
  );
}
