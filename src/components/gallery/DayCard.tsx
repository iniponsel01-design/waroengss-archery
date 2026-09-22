import Link from "next/link";
import { Calendar, FolderOpen, Images } from "lucide-react";
import { formatNumber } from "@/lib/utils/date";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";

interface DayCardProps {
  day: {
    id: string;
    dayNumber: number;
    title: string;
    description: string | null;
    date: Date | null;
    _count: {
      albums: number;
      mediaFiles: number;
    };
  };
  eventSlug: string;
}

export function DayCard({ day, eventSlug }: DayCardProps) {
  const href = `/e/${eventSlug}/day/${day.dayNumber}`;
  const hasPhotos = day._count.mediaFiles > 0;

  return (
    <Link
      href={href}
      className={cn(
        "group block bg-white rounded-2xl p-5 border transition-all duration-200",
        hasPhotos
          ? "border-brand-400 hover:border-brand-500 hover:shadow-md hover:shadow-brand-100"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm opacity-75"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
            hasPhotos
              ? "bg-brand-600 text-white"
              : "bg-gray-100 text-gray-400"
          )}
        >
          {day.dayNumber.toString().padStart(2, "0")}
        </div>

        <div className="flex items-center gap-2">
          {day.date && (
            <span className="text-xs text-gray-400">
              {format(day.date, "d MMM", { locale: id })}
            </span>
          )}
          {/* Badge status */}
          {hasPhotos ? (
            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-brand-200">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
              Tersedia
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 text-[11px] font-medium px-2 py-0.5 rounded-full">
              Segera
            </span>
          )}
        </div>
      </div>

      <h3
        className={cn(
          "font-bold transition-colors mb-1 leading-tight",
          hasPhotos
            ? "text-gray-900 group-hover:text-brand-700"
            : "text-gray-500"
        )}
      >
        {day.title}
      </h3>

      {day.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {day.description}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <FolderOpen size={12} />
          {day._count.albums} album
        </span>
        <span className="w-1 h-1 bg-gray-300 rounded-full" />
        <span
          className={cn(
            "flex items-center gap-1 font-medium",
            hasPhotos ? "text-brand-600" : "text-gray-400"
          )}
        >
          <Images size={12} />
          {hasPhotos
            ? `${formatNumber(day._count.mediaFiles)} foto`
            : "Belum ada foto"}
        </span>
      </div>
    </Link>
  );
}
