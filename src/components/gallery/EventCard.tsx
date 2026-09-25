import Link from "next/link";
import { Calendar, MapPin, Images } from "lucide-react";
import { formatDateRange, formatNumber } from "@/lib/utils/date";

export type EventStatus = "upcoming" | "ongoing" | "past" | "unknown";

export function getEventStatus(startDate: Date | null, endDate: Date | null): EventStatus {
  if (!startDate) return "unknown";
  const now = new Date();

  // Gunakan end of day untuk endDate — event yang berakhir tanggal 24
  // dianggap selesai pada 23:59:59 tanggal 24, bukan 00:00:00
  let end: Date;
  if (endDate) {
    // Set ke 23:59:59.999 hari yang sama
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    // Tidak ada endDate — gunakan end of day startDate
    end = new Date(startDate);
    end.setHours(23, 59, 59, 999);
  }

  if (startDate > now) return "upcoming";
  if (end >= now) return "ongoing";
  return "past";
}

const STATUS_BADGE: Record<EventStatus, { label: string; className: string }> = {
  upcoming: {
    label: "Akan Datang",
    className: "bg-blue-500/80 text-white",
  },
  ongoing: {
    label: "Sedang Berlangsung",
    className: "bg-green-500/80 text-white",
  },
  past: {
    label: "Selesai",
    className: "bg-gray-500/70 text-white",
  },
  unknown: {
    label: "",
    className: "",
  },
};

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
  const status = getEventStatus(event.startDate, event.endDate);
  const badge = STATUS_BADGE[status];

  return (
    <Link
      href={`/e/${event.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-200"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {event.ogImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.ogImageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Images size={40} className="text-gray-600" />
            <span className="text-gray-500 text-xs font-medium px-4 text-center line-clamp-2">
              {event.title}
            </span>
          </div>
        )}

        {/* Overlay gradient agar badge mudah dibaca */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Status badge */}
        {badge.label && (
          <div className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${badge.className}`}>
            {status === "ongoing" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse align-middle" />
            )}
            {badge.label}
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
