import { prisma } from "@/lib/db/client";
import { getAdminSession } from "@/lib/auth/session";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Calendar, FolderOpen, Images, Activity } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  const [eventCount, albumCount, photoCount, recentJobs] = await Promise.all([
    prisma.event.count(),
    prisma.album.count(),
    prisma.mediaFile.count({ where: { status: "ACTIVE" } }),
    prisma.syncJob.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { title: true, slug: true } },
        album: { select: { name: true } },
      },
    }),
  ]);

  const publishedCount = await prisma.event.count({ where: { status: "PUBLISHED" } });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selamat datang, {session?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          icon={<Calendar size={20} className="text-blue-600" />}
          label="Total Events"
          value={formatNumber(eventCount)}
          subLabel={`${publishedCount} published`}
          bgColor="bg-blue-50"
        />
        <AdminStatCard
          icon={<FolderOpen size={20} className="text-green-600" />}
          label="Total Albums"
          value={formatNumber(albumCount)}
          bgColor="bg-green-50"
        />
        <AdminStatCard
          icon={<Images size={20} className="text-purple-600" />}
          label="Total Foto"
          value={formatNumber(photoCount)}
          bgColor="bg-purple-50"
        />
        <AdminStatCard
          icon={<Activity size={20} className="text-orange-600" />}
          label="Sync Jobs"
          value={formatNumber(recentJobs.length)}
          subLabel="recent"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Buat Event", href: "/admin/dashboard/events/new", color: "bg-brand-600 text-white" },
            { label: "Kelola Events", href: "/admin/dashboard/events", color: "bg-gray-100 text-gray-700" },
            { label: "Sync Drive", href: "/admin/dashboard/drive/sync", color: "bg-gray-100 text-gray-700" },
            { label: "QR Code", href: "/admin/dashboard/tools/qrcode", color: "bg-gray-100 text-gray-700" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} text-center text-sm font-medium py-3 px-4 rounded-xl hover:opacity-90 transition-opacity`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sync Jobs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Sync Terbaru</h2>
          <Link
            href="/admin/dashboard/drive/sync"
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            Lihat semua →
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Belum ada sync job. Hubungkan Google Drive dan jalankan sync.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentJobs.map((job) => (
              <div key={job.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {job.event.title}
                    {job.album && (
                      <span className="text-gray-400"> · {job.album.name}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    +{job.addedFiles} baru · {job.updatedFiles} diperbarui
                  </p>
                </div>
                <SyncStatusBadge status={job.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SyncStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    RUNNING: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    QUEUED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
