"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  eventSlug: string;
}

export function PhotoViewer({
  photos,
  initialIndex,
  currentIndex,
  onIndexChange,
  onClose,
  eventSlug,
}: PhotoViewerProps) {
  const [zoomed, setZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const photo = photos[currentIndex];
  const total = photos.length;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    if (!photo) return;
    const favs = JSON.parse(localStorage.getItem("wss_favorites") || "[]") as string[];
    setFavorite(favs.includes(photo.id));
  }, [photo]);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
      setZoomed(false);
    }
  }, [currentIndex, onIndexChange]);

  const next = useCallback(() => {
    if (currentIndex < total - 1) {
      onIndexChange(currentIndex + 1);
      setZoomed(false);
    }
  }, [currentIndex, total, onIndexChange]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    setTouchStart(null);
  };

  const handleDownload = async () => {
    if (!photo || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}/download`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback: open in new tab
      window.open(`/api/photos/${photo.id}/download`, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/e/${eventSlug}/photo/${photo.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: photo.filename, url });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      // Could show a toast here
    }
  };

  const toggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem("wss_favorites") || "[]") as string[];
    const newFavs = favorite
      ? favs.filter((id) => id !== photo.id)
      : [...favs, photo.id];
    localStorage.setItem("wss_favorites", JSON.stringify(newFavs));
    setFavorite(!favorite);
  };

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm shrink-0">
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          aria-label="Close viewer"
        >
          <X size={20} />
        </button>

        <span className="text-white/60 text-sm tabular-nums">
          {currentIndex + 1} / {total}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              favorite
                ? "text-red-500 hover:bg-red-500/10"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={18} fill={favorite ? "currentColor" : "none"} />
          </button>

          <button
            onClick={handleShare}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            aria-label="Share photo"
          >
            <Share2 size={18} />
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            aria-label="Download photo"
          >
            <Download size={16} />
            <span className="hidden sm:inline">
              {downloading ? "Mengunduh..." : "Unduh"}
            </span>
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Prev button */}
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className={cn(
            "absolute left-2 sm:left-4 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all",
            "disabled:opacity-0 disabled:pointer-events-none"
          )}
          aria-label="Previous photo"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next button */}
        <button
          onClick={next}
          disabled={currentIndex === total - 1}
          className={cn(
            "absolute right-2 sm:right-4 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all",
            "disabled:opacity-0 disabled:pointer-events-none"
          )}
          aria-label="Next photo"
        >
          <ChevronRight size={24} />
        </button>

        {/* Image */}
        <div
          className={cn(
            "relative max-w-full max-h-full transition-transform duration-200 cursor-zoom-in",
            zoomed && "cursor-zoom-out scale-150"
          )}
          onClick={() => setZoomed(!zoomed)}
          style={{ width: "100%", height: "100%" }}
        >
          {photo.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.previewUrl}
              alt={photo.filename}
              className="absolute inset-0 w-full h-full object-contain select-none"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-600">
              Foto tidak tersedia
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-black/60 backdrop-blur-sm px-4 py-2 shrink-0">
        <p className="text-white/50 text-xs text-center truncate">{photo.filename}</p>
      </div>
    </div>
  );
}
