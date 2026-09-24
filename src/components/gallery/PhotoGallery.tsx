"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Images, ArrowUp } from "lucide-react";
import { PhotoViewer } from "./PhotoViewer";
import { cn } from "@/lib/utils/cn";

interface Photo {
  id: string;
  driveFileId: string;
  filename: string;
  displayName: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  albumId: string;
  eventDayId: string;
  eventId: string;
}

interface GalleryResponse {
  data: Photo[];
  hasNextPage: boolean;
  nextCursor?: string;
}

interface PhotoGalleryProps {
  albumId: string;
  eventSlug: string;
  initialCursor?: string;
}

export function PhotoGallery({ albumId, eventSlug, initialCursor }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  const fetchPhotos = useCallback(async (loadCursor?: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const params = new URLSearchParams({ pageSize: "48" });
      if (loadCursor) params.set("cursor", loadCursor);

      const res = await fetch(`/api/albums/${albumId}/photos?${params}`);
      if (!res.ok) throw new Error("Failed to fetch photos");

      const json: GalleryResponse = await res.json();
      setPhotos((prev) => loadCursor ? [...prev, ...json.data] : json.data);
      setHasMore(json.hasNextPage);
      setCursor(json.nextCursor);
    } catch (err) {
      console.error("Gallery fetch error:", err);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
      fetchingRef.current = false;
    }
  }, [albumId]);

  // Initial load
  useEffect(() => {
    fetchPhotos();
  }, [albumId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && initialLoaded) {
          fetchPhotos(cursor);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, cursor, initialLoaded, fetchPhotos]);

  // Keyboard navigation — hanya aktif saat viewer TIDAK terbuka.
  // Saat viewer terbuka, PhotoViewer menangani semua key event sendiri.
  useEffect(() => {
    if (viewerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setViewerIndex((i) => Math.min(i + 1, photos.length - 1));
      else if (e.key === "ArrowLeft") setViewerIndex((i) => Math.max(i - 1, 0));
      else if (e.key === "Escape") setViewerOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerOpen, photos.length]);

  // Back to Top — tampil setelah scroll 400px
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleCloseViewer = useCallback(() => setViewerOpen(false), []);

  // Empty state
  if (initialLoaded && photos.length === 0) {
    return (
      <div className="text-center py-24">
        <Images size={56} className="mx-auto text-gray-700 mb-4" />
        <p className="text-gray-400 text-lg font-medium">Belum ada foto tersedia</p>
        <p className="text-gray-600 text-sm mt-1">
          Foto sedang diproses. Silakan cek kembali beberapa saat lagi.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Skeleton saat loading awal */}
      {!initialLoaded && (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "break-inside-avoid mb-1.5 bg-gray-800 rounded animate-pulse",
                i % 3 === 0 ? "aspect-square" : i % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"
              )}
            />
          ))}
        </div>
      )}

      {/* Masonry Grid */}
      {initialLoaded && (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1.5">
          {photos.map((photo, index) => (
            <PhotoItem
              key={photo.id}
              photo={photo}
              onClick={() => {
                setViewerIndex(index);
                setViewerOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Load more sentinel */}
      <div ref={loadMoreRef} className="h-16 flex items-center justify-center mt-4">
        {loading && initialLoaded && (
          <Loader2 size={24} className="text-gray-500 animate-spin" />
        )}
        {!hasMore && photos.length > 0 && (
          <p className="text-gray-600 text-sm">
            {photos.length.toLocaleString("id-ID")} foto ditampilkan
          </p>
        )}
      </div>

      {/* Photo Viewer */}
      {viewerOpen && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          currentIndex={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={handleCloseViewer}
          eventSlug={eventSlug}
        />
      )}

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
        className={cn(
          "fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg flex items-center justify-center transition-all duration-300",
          showBackToTop && !viewerOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
}

// ── Photo Item — pakai <img> biasa, bukan Next.js Image ──────
function PhotoItem({
  photo,
  onClick,
}: {
  photo: Photo;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const aspectRatio =
    photo.width && photo.height ? photo.height / photo.width : 0.75;

  return (
    <button
      onClick={onClick}
      className="break-inside-avoid mb-1.5 block w-full relative overflow-hidden rounded bg-gray-800 group focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-950"
      style={{ paddingBottom: `${aspectRatio * 100}%` }}
      aria-label={`Buka foto: ${photo.displayName ?? photo.filename}`}
    >
      {/* Placeholder saat loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <Images size={20} className="text-gray-600" />
        </div>
      )}

      {/* Foto — pakai img biasa agar tidak diblokir Next.js */}
      {photo.thumbnailUrl && !error && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.thumbnailUrl}
          alt={photo.filename}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-300",
            "group-hover:scale-105 group-hover:brightness-90",
            loaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

      {/* Watermark — tampil samar di pojok kanan bawah */}
      {loaded && (
        <span
          className="absolute bottom-1.5 right-1.5 text-white/20 text-[9px] font-medium select-none pointer-events-none"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
        >
          WSS Gallery
        </span>
      )}
    </button>
  );
}
