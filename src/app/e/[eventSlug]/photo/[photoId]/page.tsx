import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { mediaRepository } from "@/repositories/media.repository";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { PhotoDetailViewer } from "@/components/gallery/PhotoDetailViewer";
import { config } from "@/config";

export const revalidate = 300;

interface Props {
  params: Promise<{ eventSlug: string; photoId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { photoId } = await params;
  const photo = await mediaRepository.findPublicById(photoId);
  if (!photo) return {};

  const event = photo.album.eventDay.event;
  const title = `${photo.filename} — ${event.title}`;

  return {
    title,
    description: `Foto dokumentasi dari ${photo.album.name} — ${event.title}`,
    openGraph: {
      title,
      images: photo.previewUrl ? [photo.previewUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: photo.previewUrl ? [photo.previewUrl] : [],
    },
  };
}

export default async function PhotoPage({ params }: Props) {
  const { eventSlug, photoId } = await params;
  const photo = await mediaRepository.findPublicById(photoId);

  if (!photo) notFound();

  const event = photo.album.eventDay.event;
  if (event.slug !== eventSlug) notFound();

  const albumPath = `/e/${eventSlug}/album/${photo.album.slug}`;
  const dayPath = `/e/${eventSlug}/day/${photo.album.eventDay.dayNumber}`;

  return (
    <>
      <SiteHeader transparent />

      <main className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
          <nav className="text-xs text-gray-500 mb-4 flex flex-wrap gap-1 items-center">
            <Link href={`/e/${eventSlug}`} className="hover:text-gray-300 transition-colors">
              {event.title}
            </Link>
            <span>/</span>
            <Link href={dayPath} className="hover:text-gray-300 transition-colors">
              {photo.album.eventDay.title}
            </Link>
            <span>/</span>
            <Link href={albumPath} className="hover:text-gray-300 transition-colors">
              {photo.album.name}
            </Link>
          </nav>
        </div>

        <PhotoDetailViewer
          photo={photo}
          eventSlug={eventSlug}
          albumPath={albumPath}
        />
      </main>

      <SiteFooter dark />
    </>
  );
}
