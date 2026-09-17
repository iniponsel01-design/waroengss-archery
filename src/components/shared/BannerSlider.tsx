"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
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

/**
 * Deteksi apakah banner adalah "image-only" (iklan eksternal):
 * - punya imageUrl
 * - type adalah SPONSOR
 * Jika iya, tampilkan sebagai gambar penuh yang bisa diklik
 */
function isImageOnlyBanner(banner: Banner): boolean {
  return !!banner.imageUrl && banner.type === "SPONSOR";
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

  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = setInterval(next, autoPlayMs);
    return () => clearInterval(timer);
  }, [total, paused, next, autoPlayMs]);

  if (dismissed || total === 0) return null;

  const banner = banners[current];
  const isImageOnly = isImageOnlyBanner(banner);

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-2xl", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Mode A: Image-only (iklan eksternal / sponsor) ──── */}
      {isImageOnly ? (
        <ImageBanner
          banner={banner}
          dismissable={dismissable}
          onDismiss={() => setDismissed(true)}
          navigation={
            total > 1 ? (
              <BannerNav
                current={current}
                total={total}
                onPrev={prev}
                onNext={next}
                onDot={setCurrent}
              />
            ) : null
          }
        />
      ) : (
        /* ── Mode B: Text + color (promo/announcement) ─────── */
        <TextBanner
          banner={banner}
          dismissable={dismissable}
          onDismiss={() => setDismissed(true)}
          navigation={
            total > 1 ? (
              <BannerNav
                current={current}
                total={total}
                onPrev={prev}
                onNext={next}
                onDot={setCurrent}
              />
            ) : null
          }
        />
      )}

      {/* Progress bar */}
      {total > 1 && !paused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 pointer-events-none">
          <div
            key={`${current}-progress`}
            className="h-full bg-white/60"
            style={{
              animation: `progressBar ${autoPlayMs}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Image-only banner (iklan eksternal/sponsor) ─────────────────
function ImageBanner({
  banner,
  dismissable,
  onDismiss,
  navigation,
}: {
  banner: Banner;
  dismissable: boolean;
  onDismiss: () => void;
  navigation: React.ReactNode;
}) {
  const inner = (
    <div className="relative w-full">
      {/* Gambar banner penuh */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imageUrl!}
        alt={banner.title}
        className="w-full object-cover rounded-2xl max-h-[200px] sm:max-h-[280px]"
        loading="lazy"
      />

      {/* Label "Iklan" / "Sponsor" */}
      <span className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
        Iklan
      </span>

      {/* Tombol kunjungi (opsional, jika ada linkLabel) */}
      {banner.linkUrl && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <span className="flex items-center gap-1 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow transition-colors">
            <ExternalLink size={11} />
            {banner.linkLabel || "Kunjungi"}
          </span>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {navigation}
        {dismissable && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(); }}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Tutup iklan"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );

  if (banner.linkUrl) {
    return (
      <Link
        href={banner.linkUrl}
        target={banner.linkUrl.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer sponsored"
        className="block"
        aria-label={`Iklan: ${banner.title}`}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}

// ── Text banner (promo/announcement) ───────────────────────────
function TextBanner({
  banner,
  dismissable,
  onDismiss,
  navigation,
}: {
  banner: Banner;
  dismissable: boolean;
  onDismiss: () => void;
  navigation: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
    >
      {/* Background image with overlay */}
      {banner.imageUrl && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-25"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        </div>
      )}

      <div className="relative flex items-center justify-between px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm sm:text-base leading-tight" style={{ color: banner.textColor }}>
            {banner.title}
          </p>
          {banner.subtitle && (
            <p className="text-xs sm:text-sm mt-0.5 opacity-80 line-clamp-1">
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
            >
              {banner.linkLabel}
            </Link>
          )}
          {navigation}
          {dismissable && (
            <button
              onClick={onDismiss}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              aria-label="Tutup"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
        {/* rendered by parent nav */}
      </div>
    </div>
  );
}

// ── Navigation dots + arrows ────────────────────────────────────
function BannerNav({
  current,
  total,
  onPrev,
  onNext,
  onDot,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev(); }}
        className="w-5 h-5 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
      >
        <ChevronLeft size={10} />
      </button>
      <span className="text-[10px] text-white/70 tabular-nums w-7 text-center">
        {current + 1}/{total}
      </span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext(); }}
        className="w-5 h-5 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
      >
        <ChevronRight size={10} />
      </button>
    </div>
  );
}

// ── Async loader ────────────────────────────────────────────────
export function BannerSliderLoader({ position, dismissable = true }: { position: string; dismissable?: boolean }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/banners?position=${position}`)
      .then((r) => r.json())
      .then((d) => { setBanners(d.data ?? []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [position]);

  if (!loaded || banners.length === 0) return null;

  return <BannerSlider banners={banners} dismissable={dismissable} className="mb-4" />;
}
