"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Filter, X, Loader2, Images } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { PhotoViewer } from "./PhotoViewer";

interface Day {
  id: string;
  dayNumber: number;
  title: string;
}

interface Album {
  id: string;
  name: string;
  slug: string;
  eventDayId: string;
}

interface Photo {
  id: string;
  driveFileId: string;
  filename: string;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  albumId: string;
  eventDayId: string;
  eventId: string;
}

interface SearchResultsProps {
  eventId: string;
  eventSlug: string;
  query?: string;
  dayFilter?: string;
  albumFilter?: string;
  page: number;
  days: Day[];
  albums: Album[];
}

export function SearchResults({
  eventId,
  eventSlug,
  query,
  dayFilter,
  albumFilter,
  page,
  days,
  albums,
}: SearchResultsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Search input
  const [q, setQ] = useState(query ?? "");
  const [activeDay, setActiveDay] = useState(dayFilter ?? "");
  const [activeAlbum, setActiveAlbum] = useState(albumFilter ?? "");

  useEffect(() => {
    fetchResults();
  }, [query, dayFilter, albumFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ eventSlug });
      if (query) params.set("q", query);
      if (dayFilter) params.set("dayNumber", dayFilter);
      if (albumFilter) params.set("albumSlug", albumFilter);
      params.set("page", String(page));
      params.set("pageSize", "48");

      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      setPhotos(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 0);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (activeDay) params.set("day", activeDay);
    if (activeAlbum) params.set("album", activeAlbum);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setQ("");
    setActiveDay("");
    setActiveAlbum("");
    router.push(pathname);
  };

  const hasFilters = query || dayFilter || albumFilter;

  return (
    <div className="space-y-6">
      {/* Search + Filter bar */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
        {/* Search input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Cari berdasarkan nama file, album..."
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={applyFilters}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            Cari
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm px-3 py-2.5 rounded-xl transition-colors"
            >
              <X size={14} />
              Reset
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Day filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Filter size={12} /> Hari:
            </span>
            <button
              onClick={() => setActiveDay("")}
              className={cn(
                "text-xs px-3 py-1 rounded-full transition-colors",
                !activeDay
                  ? "bg-brand-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              )}
            >
              Semua
            </button>
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setActiveDay(String(day.dayNumber))}
                className={cn(
                  "text-xs px-3 py-1 rounded-full transition-colors",
                  activeDay === String(day.dayNumber)
                    ? "bg-brand-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                )}
              >
                Day {day.dayNumber}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results info */}
      {!loading && (query || hasFilters) && (
        <p className="text-sm text-gray-400">
          {total > 0
            ? `${total.toLocaleString("id-ID")} foto ditemukan`
            : "Tidak ada foto yang ditemukan"}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="text-gray-500 animate-spin" />
        </div>
      )}

      {/* No query state */}
      {!loading && !hasFilters && photos.length === 0 && (
        <div className="text-center py-20">
          <Search size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-400 text-lg font-medium">Ketik untuk mencari foto</p>
          <p className="text-gray-600 text-sm mt-1">
            Cari berdasarkan nama file atau pilih filter di atas
          </p>
        </div>
      )}

      {/* Empty results */}
      {!loading && hasFilters && photos.length === 0 && (
        <div className="text-center py-20">
          <Images size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-400 text-lg font-medium">Foto tidak ditemukan</p>
          <button onClick={clearFilters} className="text-brand-400 text-sm mt-2 hover:underline">
            Hapus filter
          </button>
        </div>
      )}

      {/* Photo grid */}
      {!loading && photos.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1.5">
          {photos.map((photo, index) => {
            const aspectRatio =
              photo.width && photo.height ? photo.height / photo.width : 0.75;
            return (
              <button
                key={photo.id}
                onClick={() => {
                  setViewerIndex(index);
                  setViewerOpen(true);
                }}
                className="break-inside-avoid mb-1.5 block w-full relative overflow-hidden rounded bg-gray-800 group focus:outline-none"
                style={{ paddingBottom: `${aspectRatio * 100}%` }}
                aria-label={photo.filename}
              >
                {photo.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams();
                if (query) params.set("q", query);
                if (dayFilter) params.set("day", dayFilter);
                if (albumFilter) params.set("album", albumFilter);
                params.set("page", String(p));
                router.push(`${pathname}?${params.toString()}`);
              }}
              className={cn(
                "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                p === page
                  ? "bg-brand-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Photo Viewer */}
      {viewerOpen && photos.length > 0 && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          currentIndex={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerOpen(false)}
          eventSlug={eventSlug}
        />
      )}
    </div>
  );
}
