import Link from "next/link";
import { Layers, Images, FolderOpen } from "lucide-react";
import { formatNumber } from "@/lib/utils/date";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    photoCount: number;
    _count: { albums: number };
    coverPhoto?: { id: string; thumbnailUrl: string | null } | null;
  };
  eventSlug: string;
  dayNumber: number;
}

export function GroupCard({ group, eventSlug, dayNumber }: GroupCardProps) {
  const href = `/e/${eventSlug}/day/${dayNumber}/group/${group.slug}`;
  const hasPhotos = group.photoCount > 0;

  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {group.coverPhoto?.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.coverPhoto.thumbnailUrl}
            alt={group.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
            <Layers size={48} className="text-brand-300" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Sub-album count badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
          <FolderOpen size={11} />
          {group._count.albums} album
        </div>

        {/* CTA on hover */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-white text-sm font-medium">Lihat Sesi →</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors leading-tight">
            {group.name}
          </h3>
          {/* Status dot */}
          {hasPhotos && (
            <span className="shrink-0 inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-brand-200 mt-0.5">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
              Tersedia
            </span>
          )}
        </div>

        {group.description && (
          <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
            {group.description}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Images size={11} />
          {hasPhotos ? `${formatNumber(group.photoCount)} foto` : "Belum ada foto"}
        </p>
      </div>
    </Link>
  );
}
