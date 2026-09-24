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
  displayName: string | null;
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

  // Deklarasikan navigasi SEBELUM keyboard effect agar tidak stale closure
  const goPrev = useCallback(() => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) onIndexChange(currentIndex + 1);
  }, [currentIndex, total, onIndexChange]);

  // Keyboard navigation — hanya viewer yang handle key saat aktif.
  // PhotoGallery menonaktifkan handler-nya saat viewer terbuka (mencegah double-fire).
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext, onClose]);

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
        await navigator.share({ title: photo.displayName ?? photo.filename, url });
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

  const handleShareWhatsApp = () => {
    if (!photo) return;
    const url = `${window.location.origin}/e/${eventSlug}/photo/${photo.id}`;
    const text = encodeURIComponent(`Lihat foto ini: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
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

          {/* WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-green-400 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Bagikan via WhatsApp"
          >
            {/* WhatsApp icon sederhana */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main image ──────────────────────────────────── */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden bg-black"
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

        {/* Loading spinner */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}

        {/* Photo — fill area, tap to toggle zoom */}
        {photo.previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.previewUrl}
            alt={photo.filename}
            onLoad={() => setImgLoaded(true)}
            onClick={() => !zoomed && setZoomed(true)}
            className={cn(
              "transition-all duration-300 select-none",
              // Normal: isi area sebesar mungkin tanpa crop
              !zoomed && "w-full h-full object-contain cursor-zoom-in",
              // Zoomed: scale 2x, bisa di-scroll, cursor zoom-out
              zoomed && "cursor-zoom-out",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            style={zoomed ? {
              // Saat zoom: gambar besar bisa di-scroll
              width: "auto",
              height: "auto",
              maxWidth: "none",
              maxHeight: "none",
              transform: "scale(2)",
              transformOrigin: "center center",
            } : {
              // Normal: isi semua area yang tersedia
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            draggable={false}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Klik di luar gambar saat zoom untuk keluar zoom */}
        {zoomed && (
          <button
            className="absolute inset-0 w-full h-full z-0"
            onClick={() => setZoomed(false)}
            aria-label="Keluar zoom"
          />
        )}

        {/* Pinch zoom hint — mobile only, hilang setelah 3 detik */}
        {imgLoaded && !zoomed && (
          <p className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/25 text-xs sm:hidden pointer-events-none whitespace-nowrap">
            Tap untuk zoom · Geser untuk navigasi
          </p>
        )}
      </div>

      {/* ── Bottom bar — Download + filename ────────────── */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-4 flex items-end justify-between">
        <p className="text-white/40 text-xs truncate max-w-[50%]" title={photo.displayName ?? photo.filename}>
          {photo.displayName ?? photo.filename}
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
