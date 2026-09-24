import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, Heart } from "lucide-react";
import { eventRepository } from "@/repositories/event.repository";
import { prisma } from "@/lib/db/client";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import { PageBannersTop, PageBannersBottom } from "@/components/shared/PageBanners";

export const revalidate = 120;

interface Props {
  params: Promise<{ eventSlug: string; albumSlug: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug, albumSlug } = await params;
  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) return {};

  const album = await prisma.album.findFirst({
    where: { slug: albumSlug, eventDay: { eventId: event.id } },
    include: { eventDay: true },
  });
  if (!album) return {};

  return {
    title: `${album.name} — ${event.title}`,
    description: album.description || `Foto dokumentasi ${album.name} dari ${event.title}`,
    openGraph: {
      title: `${album.name} — ${event.title}`,
      description: album.description || `Foto dokumentasi ${album.name} dari ${event.title}`,
    },
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
      albumGroup: { select: { id: true, name: true, slug: true } },
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
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-3 flex flex-wrap gap-1 items-center">
              <Link href={`/e/${eventSlug}`} className="hover:text-white transition-colors">
                {event.title}
              </Link>
              <span>/</span>
              <Link
                href={`/e/${eventSlug}/day/${album.eventDay.dayNumber}`}
                className="hover:text-white transition-colors"
              >
                {album.eventDay.title}
              </Link>
              {/* Grup (opsional) */}
              {album.albumGroup && (
                <>
                  <span>/</span>
                  <Link
                    href={`/e/${eventSlug}/day/${album.eventDay.dayNumber}/group/${album.albumGroup.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {album.albumGroup.name}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-gray-300">{album.name}</span>
            </nav>

            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{album.name}</h1>
                {album.description && (
                  <p className="text-gray-400 mt-1 text-sm">{album.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                {/* Photo count */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-white leading-none">
                    {album._count.mediaFiles.toLocaleString("id-ID")}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">foto</p>
                </div>
                {/* Search link */}
                <Link
                  href={`/e/${eventSlug}/search`}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl transition-colors"
                  aria-label="Cari foto"
                >
                  <Search size={15} />
                  <span className="hidden sm:inline">Cari</span>
                </Link>
                {/* Favorit */}
                <Link
                  href={`/e/${eventSlug}/favorites`}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 text-sm px-3 py-2 rounded-xl transition-colors"
                  aria-label="Foto Favorit"
                >
                  <Heart size={15} />
                  <span className="hidden sm:inline">Favorit</span>
                </Link>
                {/* Download — disembunyikan sementara, belum dibutuhkan user */}
                {/* <a href={`/api/albums/${album.id}/download-zip`} ...>Unduh</a> */}
              </div>
            </div>
          </div>
        </section>

        {/* Banner GALLERY TOP */}
        <PageBannersTop position="GALLERY_TOP" className="max-w-7xl mx-auto px-4 pt-4" />

        {/* Photo Gallery */}
        <section className="max-w-7xl mx-auto px-1.5 sm:px-4 py-4">
          <PhotoGallery
            albumId={album.id}
            eventSlug={eventSlug}
            initialCursor={cursor}
          />
        </section>

        {/* Banner + Iklan GALLERY BOTTOM */}
        <PageBannersBottom
          bannerPosition="GALLERY_BOTTOM"
          adPosition="GALLERY_BOTTOM"
          className="max-w-7xl mx-auto px-4 pb-8 space-y-4"
        />
      </main>

      <SiteFooter dark />
    </>
  );
}
