"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Loader2, Images } from "lucide-react";
import { PhotoViewer } from "./PhotoViewer";
import { cn } from "@/lib/utils/cn";

interface Photo {
  id: string;
  driveFileId: string;
  filename: string;
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
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchPhotos = useCallback(
    async (loadCursor?: string) => {
      if (loading) return;
      setLoading(true);

      try {
        const params = new URLSearchParams();
        if (loadCursor) params.set("cursor", loadCursor);

        const res = await fetch(`/api/albums/${albumId}/photos?${params}`);
        if (!res.ok) throw new Error("Failed to fetch photos");

        const json: GalleryResponse = await res.json();

        setPhotos((prev) =>
          loadCursor ? [...prev, ...json.data] : json.data
        );
        setHasMore(json.hasNextPage);
        setCursor(json.nextCursor);
      } catch (err) {
        console.error("Gallery fetch error:", err);
      } finally {
        setLoading(false);
        setInitialLoaded(true);
      }
    },
    [albumId, loading]
  );

  // Initial load
  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  // Intersection observer for infinite scroll
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

  // Keyboard navigation for viewer
  useEffect(() => {
    if (!viewerOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setViewerIndex((i) => Math.min(i + 1, photos.length - 1));
      } else if (e.key === "ArrowLeft") {
        setViewerIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Escape") {
        setViewerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerOpen, photos.length]);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  // Empty state after initial load
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
      {/* Masonry Grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1.5 space-y-0">
        {photos.map((photo, index) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            index={index}
            onClick={() => openViewer(index)}
          />
        ))}
      </div>

      {/* Loading skeletons on initial load */}
      {!initialLoaded && (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1.5">
          {Array.from({ length: 24 }).map((_, i) => (
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

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-16 flex items-center justify-center">
        {loading && initialLoaded && (
          <Loader2 size={24} className="text-gray-500 animate-spin" />
        )}
        {!hasMore && photos.length > 0 && (
          <p className="text-gray-600 text-sm">
            {photos.length.toLocaleString()} foto ditampilkan
          </p>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {viewerOpen && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          currentIndex={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerOpen(false)}
          eventSlug={eventSlug}
        />
      )}
    </>
  );
}

// Single photo item in the grid
function PhotoItem({
  photo,
  index,
  onClick,
}: {
  photo: Photo;
  index: number;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  // Compute aspect ratio for the placeholder
  const aspectRatio =
    photo.width && photo.height
      ? photo.height / photo.width
      : 1;

  return (
    <button
      onClick={onClick}
      className="break-inside-avoid mb-1.5 block w-full relative overflow-hidden rounded bg-gray-800 group focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-950"
      style={{ paddingBottom: `${aspectRatio * 100}%` }}
      aria-label={`Buka foto: ${photo.filename}`}
    >
      {photo.thumbnailUrl && (
        <Image
          src={photo.thumbnailUrl}
          alt={photo.filename}
          fill
          className={cn(
            "object-cover transition-all duration-300",
            "group-hover:scale-105 group-hover:brightness-90",
            loaded ? "opacity-100" : "opacity-0"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
    </button>
  );
}
