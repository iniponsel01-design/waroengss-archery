"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  bgColor: string;
  textColor: string;
  type: string;
}

interface BannerSliderProps {
  banners: Banner[];
  autoPlayMs?: number;
  className?: string;
  dismissable?: boolean;
}

export function BannerSlider({
  banners,
  autoPlayMs = 5000,
  className,
  dismissable = false,
}: BannerSliderProps) {
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);

  const total = banners.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Auto-play
  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = setInterval(next, autoPlayMs);
    return () => clearInterval(timer);
  }, [total, paused, next, autoPlayMs]);

  if (dismissed || total === 0) return null;

  const banner = banners[current];

  const content = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl transition-all duration-500",
        className
      )}
      style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background image */}
      {banner.imageUrl && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-20"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative flex items-center justify-between px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm sm:text-base leading-tight" style={{ color: banner.textColor }}>
            {banner.title}
          </p>
          {banner.subtitle && (
            <p className="text-xs sm:text-sm mt-0.5 opacity-80 line-clamp-1" style={{ color: banner.textColor }}>
              {banner.subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {banner.linkUrl && banner.linkLabel && (
            <Link
              href={banner.linkUrl}
              target={banner.linkUrl.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap"
              style={{ color: banner.textColor }}
            >
              {banner.linkLabel}
            </Link>
          )}

          {/* Navigation */}
          {total > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.preventDefault(); prev(); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                aria-label="Banner sebelumnya"
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-xs opacity-60 tabular-nums w-8 text-center">
                {current + 1}/{total}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); next(); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                aria-label="Banner berikutnya"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {dismissable && (
            <button
              onClick={() => setDismissed(true)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              aria-label="Tutup banner"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {total > 1 && !paused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div
            key={`${current}-${autoPlayMs}`}
            className="h-full bg-white/50 animate-progress-bar"
            style={{ animationDuration: `${autoPlayMs}ms` }}
          />
        </div>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === current ? "bg-white scale-125" : "bg-white/40"
              )}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Wrap in link if banner has a link but no link label button
  return content;
}

// ── Async loader wrapper ────────────────────────────────────────
export function BannerSliderLoader({ position }: { position: string }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/banners?position=${position}`)
      .then((r) => r.json())
      .then((d) => { setBanners(d.data ?? []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [position]);

  if (!loaded || banners.length === 0) return null;

  return <BannerSlider banners={banners} dismissable className="mb-4" />;
}
