import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Images, FolderOpen } from "lucide-react";
import { eventRepository } from "@/repositories/event.repository";
import { prisma } from "@/lib/db/client";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { AlbumCard } from "@/components/gallery/AlbumCard";
import { mediaRepository } from "@/repositories/media.repository";
import { PageBannersTop, PageBannersBottom } from "@/components/shared/PageBanners";

export const revalidate = 30;

interface Props {
  params: Promise<{
    eventSlug: string;
    dayNumber: string;
    groupSlug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug, dayNumber, groupSlug } = await params;
  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) return {};

  const day = await prisma.eventDay.findFirst({
    where: { eventId: event.id, dayNumber: parseInt(dayNumber) },
  });
  if (!day) return {};

  const group = await prisma.albumGroup.findFirst({
    where: { eventDayId: day.id, slug: groupSlug },
  });
  if (!group) return {};

  return {
    title: `${group.name} — ${day.title} — ${event.title}`,
    description: group.description || `Album dalam ${group.name}, ${day.title} dari ${event.title}`,
  };
}

export default async function GroupPage({ params }: Props) {
  const { eventSlug, dayNumber, groupSlug } = await params;
  const dayNum = parseInt(dayNumber);
  if (isNaN(dayNum)) notFound();

  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) notFound();

  const day = await prisma.eventDay.findFirst({
    where: { eventId: event.id, dayNumber: dayNum, status: "ACTIVE" },
  });
  if (!day) notFound();

  const group = await prisma.albumGroup.findFirst({
    where: { eventDayId: day.id, slug: groupSlug, status: "ACTIVE" },
  });
  if (!group) notFound();

  // Albums dalam grup ini
  const albums = await prisma.album.findMany({
    where: { albumGroupId: group.id, status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { mediaFiles: { where: { status: "ACTIVE" } } } },
    },
  });

  const albumsWithCovers = await Promise.all(
    albums.map(async (album) => {
      let coverPhoto = null;
      if (album.coverPhotoId) {
        coverPhoto = await prisma.mediaFile.findFirst({
          where: { id: album.coverPhotoId, status: "ACTIVE" },
          select: { id: true, thumbnailUrl: true, driveFileId: true },
        });
      }
      if (!coverPhoto) coverPhoto = await mediaRepository.findFirstInAlbum(album.id);
      return { ...album, coverPhoto };
    })
  );

  const totalPhotos = albums.reduce((s, a) => s + a._count.mediaFiles, 0);

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="max-w-6xl mx-auto px-4 py-12">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-400 mb-4 flex flex-wrap items-center gap-1">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/e/${eventSlug}`} className="hover:text-white transition-colors">
                {event.title}
              </Link>
              <span>/</span>
              <Link
                href={`/e/${eventSlug}/day/${dayNum}`}
                className="hover:text-white transition-colors"
              >
                {day.title}
              </Link>
              <span>/</span>
              <span className="text-gray-200">{group.name}</span>
            </nav>

            <h1 className="text-2xl md:text-4xl font-bold mb-2">{group.name}</h1>
            {group.description && (
              <p className="text-gray-300 mt-2">{group.description}</p>
            )}
            <p className="text-sm text-gray-400 mt-3">
              {albums.length} album · {totalPhotos.toLocaleString()} foto
            </p>
          </div>
        </section>

        {/* Banner DAY TOP (reuse slot) */}
        <PageBannersTop position="DAY_TOP" className="max-w-6xl mx-auto px-4 pt-6" />

        {/* Albums dalam grup */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FolderOpen size={18} className="text-brand-600" />
            Albums
          </h2>

          {albumsWithCovers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Images size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Belum ada album tersedia</p>
              <p className="text-gray-400 text-sm mt-1">
                Foto sedang diproses. Silakan cek kembali beberapa saat lagi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {albumsWithCovers.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  eventSlug={eventSlug}
                  dayNumber={dayNum}
                />
              ))}
            </div>
          )}
        </section>

        {/* Banner + Iklan DAY BOTTOM */}
        <PageBannersBottom
          bannerPosition="DAY_BOTTOM"
          adPosition="DAY_BOTTOM"
          className="max-w-6xl mx-auto px-4 pb-8 space-y-4"
        />
      </main>

      <SiteFooter />
    </>
  );
}
