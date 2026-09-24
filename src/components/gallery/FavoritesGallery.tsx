"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Loader2, Images, Trash2 } from "lucide-react";
import { PhotoViewer } from "./PhotoViewer";
import { cn } from "@/lib/utils/cn";

interface Photo {
  id: string;
  driveFileId: string;
  filename: string;
  displayName: string | null;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  albumId: string;
  eventDayId: string;
  eventId: string;
}

interface FavoritesGalleryProps {
  eventSlug: string;
}

const STORAGE_KEY = "wss_favorites";

export function FavoritesGallery({ eventSlug }: FavoritesGalleryProps) {
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Load IDs dari localStorage
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
    setPhotoIds(ids);
  }, []);

  // Fetch detail foto dari API
  useEffect(() => {
    if (photoIds.length === 0) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetches = photoIds.map((id) =>
      fetch(`/api/photos/${id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((j) => j?.data ?? null)
        .catch(() => null)
    );

    Promise.all(fetches).then((results) => {
      setPhotos(results.filter(Boolean) as Photo[]);
      setLoading(false);
    });
  }, [photoIds]);

  const handleCloseViewer = useCallback(() => setViewerOpen(false), []);

  const removeFromFavorites = (photoId: string) => {
    const updated = photoIds.filter((id) => id !== photoId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPhotoIds(updated);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const clearAll = () => {
    if (!confirm("Hapus semua foto dari favorit?")) return;
    localStorage.setItem(STORAGE_KEY, "[]");
    setPhotoIds([]);
    setPhotos([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="text-gray-500 animate-spin" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-24">
        <Heart size={56} className="mx-auto text-gray-700 mb-4" />
        <p className="text-gray-400 text-lg font-medium">Belum ada foto favorit</p>
        <p className="text-gray-600 text-sm mt-1">
          Buka foto dan tap ikon ♡ untuk menambahkan ke favorit
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">
          {photos.length} foto favorit
        </p>
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
          Hapus semua
        </button>
      </div>

      {/* Masonry Grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1.5">
        {photos.map((photo, index) => {
          const aspectRatio = photo.width && photo.height ? photo.height / photo.width : 0.75;
          return (
            <div key={photo.id} className="break-inside-avoid mb-1.5 relative group">
              <button
                onClick={() => { setViewerIndex(index); setViewerOpen(true); }}
                className="block w-full relative overflow-hidden rounded bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                style={{ paddingBottom: `${aspectRatio * 100}%` }}
                aria-label={`Buka foto: ${photo.displayName ?? photo.filename}`}
              >
                {photo.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-all duration-300",
                      "group-hover:scale-105 group-hover:brightness-90"
                    )}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              </button>
              {/* Tombol hapus dari favorit */}
              <button
                onClick={() => removeFromFavorites(photo.id)}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/80"
                aria-label="Hapus dari favorit"
              >
                <Heart size={13} fill="currentColor" />
              </button>
            </div>
          );
        })}
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
    </>
  );
}
