import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Images } from "lucide-react";
import { formatDateRange } from "@/lib/utils/date";
import { formatNumber } from "@/lib/utils/date";

interface EventCardProps {
  event: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    location: string | null;
    startDate: Date | null;
    endDate: Date | null;
    ogImageUrl?: string | null;
    _count: {
      eventDays: number;
      mediaFiles: number;
    };
  };
}

export function EventCard({ event }: EventCardProps) {
  const dateRange = formatDateRange(event.startDate, event.endDate);

  return (
    <Link
      href={`/e/${event.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-200"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {event.ogImageUrl ? (
          <Image
            src={event.ogImageUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Images size={48} className="text-gray-600" />
          </div>
        )}

        {/* Photo count badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {formatNumber(event._count.mediaFiles)} foto
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2 mb-2">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1 text-sm text-gray-500">
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="shrink-0 text-gray-400" />
              <span className="line-clamp-1">{event.location}</span>
            </span>
          )}
          {dateRange && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="shrink-0 text-gray-400" />
              {dateRange}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
          <span>{event._count.eventDays} hari</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>{formatNumber(event._count.mediaFiles)} foto</span>
        </div>
      </div>
    </Link>
  );
}
