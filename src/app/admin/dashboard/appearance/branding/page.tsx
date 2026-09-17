import { prisma } from "@/lib/db/client";
import { BrandingForm } from "@/components/admin/BrandingForm";

export const dynamic = "force-dynamic";

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

export default async function BrandingPage() {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: BRANDING_KEYS } },
  });

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Branding & Tampilan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Atur nama, logo, warna, dan informasi platform
        </p>
      </div>
      <BrandingForm settings={settingsMap} />
    </div>
  );
}
