import { prisma } from "@/lib/db/client";
import { BannerManager } from "@/components/admin/BannerManager";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Banner & Promosi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola banner promosi yang tampil di homepage dan halaman gallery
        </p>
      </div>
      <BannerManager banners={banners} />
    </div>
  );
}
