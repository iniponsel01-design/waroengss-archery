import { prisma } from "@/lib/db/client";
import { SyncManager } from "@/components/admin/SyncManager";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const albums = await prisma.album.findMany({
    where: { driveFolderId: { not: null } },
    include: {
      eventDay: {
        include: { event: { select: { id: true, title: true, slug: true } } },
      },
      _count: { select: { mediaFiles: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const recentJobs = await prisma.syncJob.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { title: true, slug: true } },
      album: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Drive Sync</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sinkronisasi foto dari Google Drive ke database
        </p>
      </div>

      <SyncManager albums={albums} recentJobs={recentJobs} />
    </div>
  );
}
