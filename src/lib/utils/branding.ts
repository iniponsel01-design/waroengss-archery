/**
 * Server-side branding helper
 * Reads brand settings from database with fallbacks
 */

import { prisma } from "@/lib/db/client";
import { config } from "@/config";

const BRANDING_KEYS = [
  "brand_name",
  "brand_tagline",
  "brand_website",
  "brand_logo_url",
  "primary_color",
  "footer_text",
  "social_instagram",
  "social_facebook",
  "social_youtube",
  "social_tiktok",
  "hero_title",
  "hero_subtitle",
];

export interface Branding {
  brandName: string;
  brandTagline: string;
  brandWebsite: string;
  brandLogoUrl: string;
  primaryColor: string;
  footerText: string;
  socialInstagram: string;
  socialFacebook: string;
  socialYoutube: string;
  socialTiktok: string;
  heroTitle: string;
  heroSubtitle: string;
}

export async function getBranding(): Promise<Branding> {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: BRANDING_KEYS } },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const year = new Date().getFullYear();

  return {
    brandName:        map.brand_name       ?? config.app.brandName,
    brandTagline:     map.brand_tagline    ?? "Event Documentation Gallery",
    brandWebsite:     map.brand_website    ?? "",
    brandLogoUrl:     map.brand_logo_url   ?? "",
    primaryColor:     map.primary_color    ?? "#ec4899",
    footerText:       map.footer_text      ?? `© ${year} ${map.brand_name ?? config.app.brandName}. All rights reserved.`,
    socialInstagram:  map.social_instagram ?? "",
    socialFacebook:   map.social_facebook  ?? "",
    socialYoutube:    map.social_youtube   ?? "",
    socialTiktok:     map.social_tiktok    ?? "",
    heroTitle:        map.hero_title       ?? "",
    heroSubtitle:     map.hero_subtitle    ?? "",
  };
}
