import { prisma } from "@/lib/db/client";
import { QRCodeGenerator } from "@/components/admin/QRCodeGenerator";

export const dynamic = "force-dynamic";

export default async function QRCodePage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>
        <p className="text-gray-500 text-sm mt-1">
          Buat QR Code untuk event dan distribusikan ke peserta
        </p>
      </div>

      <QRCodeGenerator events={events} />
    </div>
  );
}
