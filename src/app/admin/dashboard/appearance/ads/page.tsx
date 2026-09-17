import { prisma } from "@/lib/db/client";
import { AdSlotManager } from "@/components/admin/AdSlotManager";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const slots = await prisma.adSlot.findMany({ orderBy: { position: "asc" } });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Iklan (AdSense / AdMob)</h1>
        <p className="text-gray-500 text-sm mt-1">
          Konfigurasi slot iklan Google AdSense atau AdMob
        </p>
      </div>
      <AdSlotManager slots={slots} />
    </div>
  );
}
