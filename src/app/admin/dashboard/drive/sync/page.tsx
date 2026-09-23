import { prisma } from "@/lib/db/client";
import { SyncManager } from "@/components/admin/SyncManager";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; jobPage?: string; event?: string }>;
}

const ALBUMS_PER_PAGE = 10;
const JOBS_PER_PAGE = 15;

export default async function SyncPage({ searchParams }: Props) {
  const { page, jobPage, event: eventFilter } = await searchParams;
  const albumPage = Math.max(1, parseInt(page ?? "1"));
  const jobPageNum = Math.max(1, parseInt(jobPage ?? "1"));

  // Albums with Drive folder — paginated
  const albumWhere = {
    driveFolderId: { not: null as string | null },
    status: "ACTIVE" as const,                           // exclude HIDDEN
    ...(eventFilter ? { eventDay: { event: { id: eventFilter } } } : {}),
  };

  const [albums, totalAlbums] = await prisma.$transaction([
    prisma.album.findMany({
      where: albumWhere,
      include: {
        eventDay: {
          include: {
            event: { select: { id: true, title: true, slug: true } },
          },
        },
        albumGroup: { select: { id: true, name: true } },
        _count: { select: { mediaFiles: { where: { status: "ACTIVE" } } } },
      },
      orderBy: [
        { eventDay: { event: { title: "asc" } } },
        { sortOrder: "asc" },
      ],
      skip: (albumPage - 1) * ALBUMS_PER_PAGE,
      take: ALBUMS_PER_PAGE,
    }),
    prisma.album.count({ where: albumWhere }),
  ]);

  // Sync jobs — paginated
  const jobWhere = eventFilter ? { eventId: eventFilter } : {};
  const [recentJobs, totalJobs] = await prisma.$transaction([
    prisma.syncJob.findMany({
      where: jobWhere,
      take: JOBS_PER_PAGE,
      skip: (jobPageNum - 1) * JOBS_PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { id: true, title: true, slug: true } },
        album: { select: { name: true } },
      },
    }),
    prisma.syncJob.count({ where: jobWhere }),
  ]);

  // All albums with drive folder (for Sync All — ikuti filter event yang aktif)
  const allAlbumsForSyncAll = await prisma.album.findMany({
    where: {
      driveFolderId: { not: null },
      status: "ACTIVE",                                  // exclude HIDDEN
      ...(eventFilter ? { eventDay: { event: { id: eventFilter } } } : {}),
    },
    select: { id: true, name: true, driveFolderId: true },
  });

  // Events for filter dropdown
  const events = await prisma.event.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Drive Sync</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sinkronisasi foto dari Google Drive ke database
        </p>
      </div>

      <SyncManager
        albums={albums}
        totalAlbums={totalAlbums}
        albumPage={albumPage}
        albumsPerPage={ALBUMS_PER_PAGE}
        recentJobs={recentJobs}
        totalJobs={totalJobs}
        jobPage={jobPageNum}
        jobsPerPage={JOBS_PER_PAGE}
        allAlbumsForSyncAll={allAlbumsForSyncAll}
        events={events}
        currentEventFilter={eventFilter}
      />
    </div>
  );
}
