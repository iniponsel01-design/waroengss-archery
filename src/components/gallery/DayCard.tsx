import Link from "next/link";
import { Calendar, FolderOpen, Images } from "lucide-react";
import { formatNumber } from "@/lib/utils/date";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl p-5 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 font-bold text-sm">
          {day.dayNumber.toString().padStart(2, "0")}
        </div>
        {day.date && (
          <span className="text-xs text-gray-400">
            {format(day.date, "d MMM", { locale: id })}
          </span>
        )}
      </div>

      <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors mb-1 leading-tight">
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
        <span className="flex items-center gap-1">
          <Images size={12} />
          {formatNumber(day._count.mediaFiles)} foto
        </span>
      </div>
    </Link>
  );
}
