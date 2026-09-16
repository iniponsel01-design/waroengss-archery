import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { eventRepository } from "@/repositories/event.repository";
import { prisma } from "@/lib/db/client";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";

export const revalidate = 120;

interface Props {
  params: Promise<{ eventSlug: string; albumSlug: string }>;
  searchParams: Promise<{ cursor?: string; q?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug, albumSlug } = await params;
  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) return {};

  const album = await prisma.album.findFirst({
    where: {
      slug: albumSlug,
      eventDay: { eventId: event.id },
    },
    include: { eventDay: true },
  });
  if (!album) return {};

  return {
    title: `${album.name} — ${event.title}`,
    description: album.description || `Foto ${album.name} dari ${event.title}`,
  };
}

export default async function AlbumPage({ params, searchParams }: Props) {
  const { eventSlug, albumSlug } = await params;
  const { cursor } = await searchParams;

  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) notFound();

  const album = await prisma.album.findFirst({
    where: {
      slug: albumSlug,
      status: "ACTIVE",
      eventDay: { eventId: event.id, status: "ACTIVE" },
    },
    include: {
      eventDay: true,
      _count: { select: { mediaFiles: { where: { status: "ACTIVE" } } } },
    },
  });
  if (!album) notFound();

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-gray-950">
        {/* Header */}
        <section className="bg-gray-900 text-white border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <nav className="text-sm text-gray-400 mb-3">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href={`/e/${eventSlug}`} className="hover:text-white transition-colors">
                {event.title}
              </Link>
              <span className="mx-2">/</span>
              <Link
                href={`/e/${eventSlug}/day/${album.eventDay.dayNumber}`}
                className="hover:text-white transition-colors"
              >
                {album.eventDay.title}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-200">{album.name}</span>
            </nav>

            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{album.name}</h1>
                {album.description && (
                  <p className="text-gray-400 mt-1">{album.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {album._count.mediaFiles.toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">foto</p>
              </div>
            </div>
          </div>
        </section>

        {/* Photo Gallery */}
        <section className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
          <PhotoGallery
            albumId={album.id}
            eventSlug={eventSlug}
            initialCursor={cursor}
          />
        </section>
      </main>

      <SiteFooter dark />
    </>
  );
}
