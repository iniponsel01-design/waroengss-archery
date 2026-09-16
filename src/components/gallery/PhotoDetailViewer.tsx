"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Share2, Heart, ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/date";

interface PhotoDetail {
  id: string;
  driveFileId: string;
  filename: string;
  mimeType: string;
  fileSize: bigint | number | null;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  album: {
    id: string;
    name: string;
    slug: string;
    eventDay: {
      id: string;
      dayNumber: number;
      title: string;
      event: {
        id: string;
        slug: string;
        title: string;
      };
    };
  };
}

interface PhotoDetailViewerProps {
  photo: PhotoDetail;
  eventSlug: string;
  albumPath: string;
}

export function PhotoDetailViewer({
  photo,
  eventSlug,
  albumPath,
}: PhotoDetailViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [favorite, setFavorite] = useState(() => {
    if (typeof window !== "undefined") {
      const favs = JSON.parse(
        localStorage.getItem("wss_favorites") || "[]"
      ) as string[];
      return favs.includes(photo.id);
    }
    return false;
  });

  const handleDownload = async () => {
    if (downloading) return;
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
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: photo.filename, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const toggleFavorite = () => {
    const favs = JSON.parse(
      localStorage.getItem("wss_favorites") || "[]"
    ) as string[];
    const newFavs = favorite
      ? favs.filter((id) => id !== photo.id)
      : [...favs, photo.id];
    localStorage.setItem("wss_favorites", JSON.stringify(newFavs));
    setFavorite(!favorite);
  };

  const fileSizeNum =
    photo.fileSize !== null && photo.fileSize !== undefined
      ? Number(photo.fileSize)
      : null;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-112px)]">
      {/* Photo area */}
      <div className="flex-1 flex items-center justify-center bg-black relative min-h-[50vh] lg:min-h-0">
        <Link
          href={albumPath}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full"
        >
          <ArrowLeft size={14} />
          Kembali
        </Link>

        {photo.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.previewUrl}
            alt={photo.filename}
            className="absolute inset-0 w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-gray-600 text-center p-8">
            <p>Foto tidak tersedia</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:w-80 bg-gray-900 border-l border-gray-800 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-white font-bold text-sm line-clamp-2 mb-1">
            {photo.filename}
          </h2>
          <p className="text-gray-500 text-xs">
            {photo.album.eventDay.event.title} · {photo.album.eventDay.title} ·{" "}
            {photo.album.name}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          {photo.width && photo.height && (
            <div className="flex justify-between text-gray-400">
              <span>Dimensi</span>
              <span className="text-gray-300">
                {photo.width} × {photo.height}
              </span>
            </div>
          )}
          {fileSizeNum && (
            <div className="flex justify-between text-gray-400">
              <span>Ukuran</span>
              <span className="text-gray-300">{formatFileSize(fileSizeNum)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-400">
            <span>Format</span>
            <span className="text-gray-300 uppercase">
              {photo.mimeType.split("/")[1]}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            <Download size={16} />
            {downloading ? "Mengunduh..." : "Unduh Foto"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 px-3 rounded-xl transition-colors"
            >
              <Share2 size={14} />
              Bagikan
            </button>

            <button
              onClick={toggleFavorite}
              className={cn(
                "flex items-center justify-center gap-1.5 text-sm py-2 px-3 rounded-xl transition-colors",
                favorite
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              )}
            >
              <Heart size={14} fill={favorite ? "currentColor" : "none"} />
              {favorite ? "Favorit" : "Simpan"}
            </button>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <Link
            href={albumPath}
            className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink size={13} />
            Lihat semua foto album
          </Link>
        </div>
      </div>
    </div>
  );
}
