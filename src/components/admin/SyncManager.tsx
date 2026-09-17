"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Loader2, CheckCircle, XCircle, Clock,
  Play, ChevronLeft, ChevronRight, Filter, AlertTriangle,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/date";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface Album {
  id: string;
  name: string;
  driveFolderId: string | null;
  eventDay: { event: { id: string; title: string; slug: string } };
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
  errorMessage: string | null;
  createdAt: Date;
  event: { id: string; title: string; slug: string };
  album: { name: string } | null;
}

interface Event {
  id: string;
  title: string;
}

interface SyncManagerProps {
  albums: Album[];
  totalAlbums: number;
  albumPage: number;
  albumsPerPage: number;
  recentJobs: SyncJob[];
  totalJobs: number;
  jobPage: number;
  jobsPerPage: number;
  allAlbumsForSyncAll: { id: string; name: string; driveFolderId: string | null }[];
  events: Event[];
  currentEventFilter?: string;
}

const statusIcon: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle size={14} className="text-green-500 shrink-0" />,
  FAILED:    <XCircle    size={14} className="text-red-500 shrink-0" />,
  RUNNING:   <Loader2    size={14} className="text-blue-500 animate-spin shrink-0" />,
  QUEUED:    <Clock      size={14} className="text-gray-400 shrink-0" />,
  PARTIAL:   <AlertTriangle size={14} className="text-yellow-500 shrink-0" />,
};

const statusBadge: Record<string, string> = {
  COMPLETED: "text-green-700 bg-green-50",
  FAILED:    "text-red-700 bg-red-50",
  RUNNING:   "text-blue-700 bg-blue-50",
  QUEUED:    "text-gray-600 bg-gray-100",
  PARTIAL:   "text-yellow-700 bg-yellow-50",
};

export function SyncManager({
  albums,
  totalAlbums,
  albumPage,
  albumsPerPage,
  recentJobs,
  totalJobs,
  jobPage,
  jobsPerPage,
  allAlbumsForSyncAll,
  events,
  currentEventFilter,
}: SyncManagerProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncResults, setSyncResults] = useState<Record<string, string>>({});
  const [syncAllProgress, setSyncAllProgress] = useState({ done: 0, total: 0 });

  const totalAlbumPages = Math.ceil(totalAlbums / albumsPerPage);
  const totalJobPages = Math.ceil(totalJobs / jobsPerPage);

  // Sync single album
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
        const j = json.data;
        setSyncResults((r) => ({
          ...r,
          [albumId]: `✓ +${j.addedFiles} baru · ${j.updatedFiles} diperbarui · ${j.deletedFiles} dihapus`,
        }));
        router.refresh();
      } else {
        setSyncResults((r) => ({ ...r, [albumId]: `✗ ${json.error || "Sync gagal"}` }));
      }
    } catch {
      setSyncResults((r) => ({ ...r, [albumId]: "✗ Kesalahan jaringan" }));
    } finally {
      setSyncing(null);
    }
  };

  // Sync ALL albums sequentially
  const handleSyncAll = async () => {
    if (!confirm(`Sync semua ${allAlbumsForSyncAll.length} album sekaligus?\n\nProses ini mungkin memakan waktu beberapa menit.`)) return;

    setSyncingAll(true);
    setSyncAllProgress({ done: 0, total: allAlbumsForSyncAll.length });

    let done = 0;
    let totalAdded = 0;
    let totalFailed = 0;

    for (const album of allAlbumsForSyncAll) {
      try {
        const res = await fetch("/api/admin/drive/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: album.id }),
        });
        const json = await res.json();
        if (json.success) {
          totalAdded += json.data.addedFiles ?? 0;
        } else {
          totalFailed++;
        }
      } catch {
        totalFailed++;
      }
      done++;
      setSyncAllProgress({ done, total: allAlbumsForSyncAll.length });
    }

    setSyncingAll(false);
    router.refresh();
    alert(`Sync selesai!\n✓ ${totalAdded} foto baru\n${totalFailed > 0 ? `✗ ${totalFailed} album gagal` : "Semua album berhasil"}`);
  };

  const buildUrl = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (params.page) p.set("page", params.page);
    if (params.jobPage) p.set("jobPage", params.jobPage);
    if (params.event ?? currentEventFilter) p.set("event", params.event ?? currentEventFilter!);
    return `?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* ── Filter + Sync All ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Event filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={currentEventFilter ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                const url = val ? `?event=${val}` : "?";
                router.push(url);
              }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Semua Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>

          {/* Sync All button */}
          <button
            onClick={handleSyncAll}
            disabled={syncingAll || allAlbumsForSyncAll.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {syncingAll ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {syncAllProgress.done}/{syncAllProgress.total} album...
              </>
            ) : (
              <>
                <Play size={14} />
                Sync Semua ({allAlbumsForSyncAll.length} album)
              </>
            )}
          </button>
        </div>

        {/* Progress bar untuk Sync All */}
        {syncingAll && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Menyinkronkan...</span>
              <span>{syncAllProgress.done} / {syncAllProgress.total}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(syncAllProgress.done / syncAllProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Albums ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Album Siap Sync</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalAlbums} album terhubung ke Google Drive
            </p>
          </div>
          {totalAlbumPages > 1 && (
            <span className="text-xs text-gray-400">
              Hal {albumPage} dari {totalAlbumPages}
            </span>
          )}
        </div>

        {albums.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            Belum ada album yang terhubung ke Google Drive.
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {albums.map((album) => (
                <div key={album.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {album.eventDay.event.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {album.name} · {formatNumber(album._count.mediaFiles)} foto
                    </p>
                    {syncResults[album.id] && (
                      <p className={cn(
                        "text-xs mt-0.5 font-medium",
                        syncResults[album.id].startsWith("✓") ? "text-green-600" : "text-red-600"
                      )}>
                        {syncResults[album.id]}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSync(album.id)}
                    disabled={!!syncing || syncingAll}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    {syncing === album.id
                      ? <><Loader2 size={12} className="animate-spin" /> Syncing...</>
                      : <><RefreshCw size={12} /> Sync</>
                    }
                  </button>
                </div>
              ))}
            </div>

            {/* Album pagination */}
            {totalAlbumPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href={buildUrl({ page: String(albumPage - 1) })}
                  className={cn(
                    "flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors",
                    albumPage <= 1
                      ? "text-gray-300 pointer-events-none"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <ChevronLeft size={14} /> Sebelumnya
                </Link>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalAlbumPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <Link
                        key={p}
                        href={buildUrl({ page: String(p) })}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center text-xs rounded-lg transition-colors",
                          p === albumPage
                            ? "bg-brand-600 text-white font-semibold"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href={buildUrl({ page: String(albumPage + 1) })}
                  className={cn(
                    "flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors",
                    albumPage >= totalAlbumPages
                      ? "text-gray-300 pointer-events-none"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  Berikutnya <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Sync Job History ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Riwayat Sync</h2>
            <p className="text-xs text-gray-400 mt-0.5">{totalJobs} job total</p>
          </div>
          {totalJobPages > 1 && (
            <span className="text-xs text-gray-400">
              Hal {jobPage} dari {totalJobPages}
            </span>
          )}
        </div>

        {recentJobs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Belum ada riwayat sync.
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {recentJobs.map((job) => (
                <div key={job.id} className="px-6 py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="mt-0.5">{statusIcon[job.status]}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {job.event.title}
                          {job.album && (
                            <span className="text-gray-400 font-normal"> · {job.album.name}</span>
                          )}
                        </p>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full font-medium",
                          statusBadge[job.status] ?? "bg-gray-100 text-gray-600"
                        )}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {job.totalFiles} total · +{job.addedFiles} baru · {job.updatedFiles} diperbarui · {job.deletedFiles} dihapus
                        {job.failedFiles > 0 && (
                          <span className="text-red-500"> · {job.failedFiles} gagal</span>
                        )}
                      </p>
                      {job.errorMessage && (
                        <p className="text-xs text-red-500 mt-0.5 truncate max-w-sm" title={job.errorMessage}>
                          {job.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <time className="text-xs text-gray-400 shrink-0">
                    {new Date(job.createdAt).toLocaleString("id-ID", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </time>
                </div>
              ))}
            </div>

            {/* Job pagination */}
            {totalJobPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href={buildUrl({ jobPage: String(jobPage - 1) })}
                  className={cn(
                    "flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors",
                    jobPage <= 1
                      ? "text-gray-300 pointer-events-none"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <ChevronLeft size={14} /> Sebelumnya
                </Link>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalJobPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <Link
                        key={p}
                        href={buildUrl({ jobPage: String(p) })}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center text-xs rounded-lg transition-colors",
                          p === jobPage
                            ? "bg-brand-600 text-white font-semibold"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href={buildUrl({ jobPage: String(jobPage + 1) })}
                  className={cn(
                    "flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors",
                    jobPage >= totalJobPages
                      ? "text-gray-300 pointer-events-none"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  Berikutnya <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
