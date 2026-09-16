"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Heart,
  Copy,
  Check,
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
  currentIndex,
  onIndexChange,
  onClose,
  eventSlug,
}: PhotoViewerProps) {
  const [zoomed, setZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Touch swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const photo = photos[currentIndex];
  const total = photos.length;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Reset on photo change
  useEffect(() => {
    setImgLoaded(false);
    setZoomed(false);
  }, [currentIndex]);

  // Favorites from localStorage
  useEffect(() => {
    if (!photo) return;
    const favs = JSON.parse(localStorage.getItem("wss_favorites") || "[]") as string[];
    setFavorite(favs.includes(photo.id));
  }, [photo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, total]); // eslint-disable-line react-hooks/exhaustive-deps

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) onIndexChange(currentIndex + 1);
  }, [currentIndex, total, onIndexChange]);

  // Touch swipe — supports both horizontal swipe nav and vertical scroll
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const dx = touchStartX - e.changedTouches[0].clientX;
    const dy = touchStartY - e.changedTouches[0].clientY;
    // Only swipe if horizontal movement is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx > 0) goNext();
      else goPrev();
    }
    setTouchStartX(null);
    setTouchStartY(null);
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
    } catch {
      window.open(`/api/photos/${photo.id}/download`, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!photo) return;
    const url = `${window.location.origin}/e/${eventSlug}/photo/${photo.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: photo.filename, url });
        return;
      } catch {
        // cancelled or not supported
      }
    }
    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy link:", url);
    }
  };

  const toggleFavorite = () => {
    if (!photo) return;
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
      className="fixed inset-0 z-50 bg-black flex flex-col select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${currentIndex + 1} dari ${total}: ${photo.filename}`}
    >
      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        {/* Close */}
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        {/* Counter — sesuai master prompt: "127 / 4,823" */}
        <div className="flex flex-col items-center">
          <span className="text-white font-semibold text-sm tabular-nums">
            {(currentIndex + 1).toLocaleString("id-ID")} / {total.toLocaleString("id-ID")}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Favorite */}
          <button
            onClick={toggleFavorite}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
              favorite
                ? "text-red-400 hover:bg-red-400/10"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            aria-label={favorite ? "Hapus dari favorit" : "Tambah ke favorit"}
          >
            <Heart size={18} fill={favorite ? "currentColor" : "none"} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Bagikan"
          >
            {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
          </button>
        </div>
      </div>

      {/* ── Main image ──────────────────────────────────── */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={cn(
            "absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all",
            "disabled:opacity-0 disabled:pointer-events-none backdrop-blur-sm"
          )}
          aria-label="Foto sebelumnya"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={currentIndex === total - 1}
          className={cn(
            "absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all",
            "disabled:opacity-0 disabled:pointer-events-none backdrop-blur-sm"
          )}
          aria-label="Foto berikutnya"
        >
          <ChevronRight size={24} />
        </button>

        {/* Loading placeholder */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}

        {/* Photo — tap to zoom */}
        {photo.previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.previewUrl}
            alt={photo.filename}
            onLoad={() => setImgLoaded(true)}
            onClick={() => setZoomed((z) => !z)}
            className={cn(
              "max-w-full max-h-full object-contain transition-transform duration-200",
              zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            style={{ maxHeight: "calc(100vh - 120px)" }}
            draggable={false}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Pinch zoom hint — mobile only */}
        {imgLoaded && (
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/30 text-xs sm:hidden pointer-events-none">
            Cubit untuk zoom
          </p>
        )}
      </div>

      {/* ── Bottom bar — Download + filename ────────────── */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-4 flex items-end justify-between">
        <p className="text-white/40 text-xs truncate max-w-[50%]" title={photo.filename}>
          {photo.filename}
        </p>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
          aria-label="Unduh foto"
        >
          <Download size={15} />
          {downloading ? "Mengunduh..." : "Unduh"}
        </button>
      </div>

      {/* ── Thumbnail strip (if many photos) ────────────── */}
      {total > 1 && total <= 50 && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1 pointer-events-none">
          {photos.slice(
            Math.max(0, currentIndex - 3),
            Math.min(total, currentIndex + 4)
          ).map((_, i) => {
            const realIndex = Math.max(0, currentIndex - 3) + i;
            return (
              <div
                key={realIndex}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  realIndex === currentIndex
                    ? "bg-white scale-125"
                    : "bg-white/30"
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
