"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatNumber } from "@/lib/utils/date";

interface Album {
  id: string;
  name: string;
  driveFolderId: string | null;
  eventDay: {
    event: { title: string; slug: string };
  };
  _count: { mediaFiles: number };
}

interface SyncJob {
  id: string;
  status: string;
  addedFiles: number;
  updatedFiles: number;
  deletedFiles: number;
  totalFiles: number;
  failedFiles: number;
  createdAt: Date;
  event: { title: string; slug: string };
  album: { name: string } | null;
}

interface SyncManagerProps {
  albums: Album[];
  recentJobs: SyncJob[];
}

const statusIcon: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle size={14} className="text-green-500" />,
  FAILED: <XCircle size={14} className="text-red-500" />,
  RUNNING: <Loader2 size={14} className="text-blue-500 animate-spin" />,
  QUEUED: <Clock size={14} className="text-gray-400" />,
  PARTIAL: <CheckCircle size={14} className="text-yellow-500" />,
};

const statusColor: Record<string, string> = {
  COMPLETED: "text-green-700 bg-green-50",
  FAILED: "text-red-700 bg-red-50",
  RUNNING: "text-blue-700 bg-blue-50",
  QUEUED: "text-gray-600 bg-gray-100",
  PARTIAL: "text-yellow-700 bg-yellow-50",
};

export function SyncManager({ albums, recentJobs }: SyncManagerProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, string>>({});

  const handleSync = async (albumId: string) => {
    setSyncing(albumId);
    setSyncResults((r) => ({ ...r, [albumId]: "" }));

    try {
      const res = await fetch("/api/admin/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });

      const json = await res.json();

      if (json.success) {
        const job = json.data;
        setSyncResults((r) => ({
          ...r,
          [albumId]: `✓ +${job.addedFiles} baru, ${job.updatedFiles} diperbarui, ${job.deletedFiles} dihapus`,
        }));
        router.refresh();
      } else {
        setSyncResults((r) => ({ ...r, [albumId]: `✗ ${json.error}` }));
      }
    } catch {
      setSyncResults((r) => ({ ...r, [albumId]: "✗ Terjadi kesalahan" }));
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Albums ready to sync */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Album Siap Sync</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Album yang sudah terhubung dengan folder Google Drive
          </p>
        </div>

        {albums.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            Belum ada album yang terhubung ke Google Drive.
            <br />
            Edit event → tambah album → isi Drive Folder ID.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {albums.map((album) => (
              <div key={album.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {album.eventDay.event.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {album.name} · {formatNumber(album._count.mediaFiles)} foto
                  </p>
                  {syncResults[album.id] && (
                    <p
                      className={`text-xs mt-1 font-medium ${
                        syncResults[album.id].startsWith("✓")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {syncResults[album.id]}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSync(album.id)}
                  disabled={!!syncing}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
                >
                  {syncing === album.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Sync
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent sync jobs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Riwayat Sync</h2>
        </div>

        {recentJobs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Belum ada riwayat sync.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentJobs.map((job) => (
              <div key={job.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {statusIcon[job.status]}
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {job.event.title}
                      {job.album && (
                        <span className="text-gray-400 font-normal"> · {job.album.name}</span>
                      )}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[job.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {job.totalFiles} total · +{job.addedFiles} baru · {job.updatedFiles} diperbarui · {job.deletedFiles} dihapus
                    {job.failedFiles > 0 && (
                      <span className="text-red-500"> · {job.failedFiles} gagal</span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(job.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
