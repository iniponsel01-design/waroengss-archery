/**
 * PageBanners — Server component
 * Fetches and renders banners + ad for a given page position
 * Used on: event, day, album, search pages
 */

import { prisma } from "@/lib/db/client";
import { BannerSlider } from "./BannerSlider";
import { AdBlock } from "./AdBlock";

type BannerPosition =
  | "HOME_TOP"    | "HOME_BOTTOM"
  | "EVENT_TOP"   | "EVENT_BOTTOM"
  | "DAY_TOP"     | "DAY_BOTTOM"
  | "GALLERY_TOP" | "GALLERY_BOTTOM"
  | "SEARCH_TOP";

type AdPosition =
  | "HOME_BOTTOM"
  | "EVENT_BOTTOM"
  | "DAY_BOTTOM"
  | "GALLERY_BOTTOM"
  | "PHOTO_SIDEBAR";

interface PageBannersTopProps {
  position: BannerPosition;
  className?: string;
}

interface PageBannersBottomProps {
  bannerPosition: BannerPosition;
  adPosition: AdPosition;
  className?: string;
}

const now = () => new Date();

async function fetchBanners(position: BannerPosition) {
  const n = now();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      position,
      OR: [{ startsAt: null }, { startsAt: { lte: n } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: n } }] }],
    },
    orderBy: { sortOrder: "asc" },
  });
}

async function fetchAd(position: AdPosition) {
  return prisma.adSlot.findFirst({
    where: { isActive: true, position },
  });
}

/** Banner di atas konten halaman */
export async function PageBannersTop({ position, className }: PageBannersTopProps) {
  const banners = await fetchBanners(position);
  if (banners.length === 0) return null;

  return (
    <div className={className ?? "max-w-7xl mx-auto px-4 pt-4"}>
      <BannerSlider banners={banners} dismissable autoPlayMs={6000} />
    </div>
  );
}

/** Banner + iklan di bawah konten halaman */
export async function PageBannersBottom({
  bannerPosition,
  adPosition,
  className,
}: PageBannersBottomProps) {
  const [banners, adSlot] = await Promise.all([
    fetchBanners(bannerPosition),
    fetchAd(adPosition),
  ]);

  if (banners.length === 0 && !adSlot) return null;

  return (
    <div className={className ?? "max-w-7xl mx-auto px-4 py-6 space-y-4"}>
      {banners.length > 0 && (
        <BannerSlider banners={banners} dismissable autoPlayMs={7000} />
      )}
      {adSlot && (
        <div>
          <p className="text-xs text-gray-500 text-center mb-2">Advertisement</p>
          <AdBlock
            adClient={adSlot.adClient}
            adSlot={adSlot.adSlot}
            adFormat={adSlot.adFormat}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
