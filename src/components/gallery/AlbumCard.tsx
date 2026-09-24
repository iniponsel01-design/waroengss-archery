import Link from "next/link";
import { Images } from "lucide-react";
import { formatNumber } from "@/lib/utils/date";
import { NewPhotoBadge } from "./NewPhotoBadge";

interface AlbumCardProps {
  album: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    _count: { mediaFiles: number };
    coverPhoto?: {
      id: string;
      thumbnailUrl: string | null;
      driveFileId?: string;
    } | null;
  };
  eventSlug: string;
  dayNumber: number;
  /** Jika album berada dalam grup, slug grup untuk breadcrumb di halaman album */
  groupSlug?: string;
}

export function AlbumCard({ album, eventSlug, dayNumber, groupSlug }: AlbumCardProps) {
  const href = `/e/${eventSlug}/album/${album.slug}`;

  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {album.coverPhoto?.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverPhoto.thumbnailUrl}
            alt={album.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Images size={40} className="text-gray-300" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-white text-sm font-medium">Lihat Album →</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
          {album.name}
        </h3>
        {album.description && (
          <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
            {album.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-gray-400">
            {formatNumber(album._count.mediaFiles)} foto
          </p>
          <NewPhotoBadge storageKey={`album-${album.id}`} currentCount={album._count.mediaFiles} />
        </div>
      </div>
    </Link>
  );
}
