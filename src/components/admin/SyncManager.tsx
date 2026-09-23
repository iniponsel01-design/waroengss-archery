"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Loader2, CheckCircle, XCircle, Clock,
  Play, ChevronLeft, ChevronRight, Filter, AlertTriangle,
  FileImage,
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

  // Progress detail per album: { total, processed, currentFile }
  const [syncProgress, setSyncProgress] = useState<Record<string, {
    total: number;
    processed: number;
    currentFile: string | null;
  }>>({});

  // Progress Sync All global
  const [syncAllCurrentAlbum, setSyncAllCurrentAlbum] = useState<string | null>(null);
  const [syncAllFileProgress, setSyncAllFileProgress] = useState<{
    total: number; processed: number; currentFile: string | null;
  } | null>(null);

  const totalAlbumPages = Math.ceil(totalAlbums / albumsPerPage);
  const totalJobPages = Math.ceil(totalJobs / jobsPerPage);

  // ── Poll single job — return job data + update progress state ─
  const pollJob = (
    jobId: string,
    albumId?: string
  ): Promise<{ addedFiles: number; updatedFiles: number; deletedFiles: number; status: string }> => {
    return new Promise((resolve) => {
      const INTERVAL = 2000;   // lebih cepat: 2 detik
      const MAX = 90;          // 3 menit max
      let attempts = 0;
      const check = async () => {
        attempts++;
        try {
          const res = await fetch(`/api/admin/drive/sync?jobId=${jobId}`);
          const json = await res.json();
          const job = json.data;
          if (!job) { resolve({ addedFiles: 0, updatedFiles: 0, deletedFiles: 0, status: "FAILED" }); return; }

          // Update progress state jika ada albumId
          if (albumId && job.totalFiles > 0) {
            setSyncProgress((prev) => ({
              ...prev,
              [albumId]: {
                total:       job.totalFiles,
                processed:   job.processedFiles ?? 0,
                currentFile: job.currentFile ?? null,
              },
            }));
          }

          if (["COMPLETED", "PARTIAL", "FAILED"].includes(job.status)) {
            // Bersihkan progress
            if (albumId) {
              setSyncProgress((prev) => {
                const next = { ...prev };
                delete next[albumId];
                return next;
              });
            }
            resolve(job);
            return;
          }
        } catch { /* silent */ }
        if (attempts < MAX) setTimeout(check, INTERVAL);
        else resolve({ addedFiles: 0, updatedFiles: 0, deletedFiles: 0, status: "TIMEOUT" });
      };
      setTimeout(check, INTERVAL);
    });
  };

  // ── Sync single album ──────────────────────────────────────
  const handleSync = async (albumId: string) => {
    setSyncing(albumId);
    setSyncResults((r) => ({ ...r, [albumId]: "⏳ Memulai sync..." }));
    setSyncProgress((p) => ({ ...p, [albumId]: { total: 0, processed: 0, currentFile: null } }));
    try {
      const res = await fetch("/api/admin/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });
      const json = await res.json();
      if (!json.success) {
        setSyncResults((r) => ({ ...r, [albumId]: `✗ ${json.error || "Sync gagal"}` }));
        setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
        return;
      }
      const jobId = json.data?.jobId;
      if (!jobId) {
        setSyncResults((r) => ({ ...r, [albumId]: "✗ Tidak ada jobId dari server" }));
        setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
        return;
      }
      setSyncResults((r) => ({ ...r, [albumId]: `⏳ Sync berjalan...` }));
      const job = await pollJob(jobId, albumId);
      if (job.status === "COMPLETED" || job.status === "PARTIAL") {
        setSyncResults((r) => ({
          ...r,
          [albumId]: `✓ +${job.addedFiles} baru · ${job.updatedFiles} diperbarui · ${job.deletedFiles} dihapus`,
        }));
        router.refresh();
      } else {
        setSyncResults((r) => ({ ...r, [albumId]: `✗ Sync ${job.status.toLowerCase()}` }));
      }
    } catch {
      setSyncResults((r) => ({ ...r, [albumId]: "✗ Kesalahan jaringan" }));
      setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
    } finally {
      setSyncing(null);
    }
  };

  // ── Sync ALL albums sequentially ──────────────────────────
  const handleSyncAll = async () => {
    if (!confirm(`Sync semua ${allAlbumsForSyncAll.length} album sekaligus?\n\nProses ini mungkin memakan waktu beberapa menit.`)) return;

    setSyncingAll(true);
    setSyncAllProgress({ done: 0, total: allAlbumsForSyncAll.length });
    setSyncAllCurrentAlbum(null);
    setSyncAllFileProgress(null);

    let done = 0;
    let totalAdded = 0;
    let totalFailed = 0;

    for (const album of allAlbumsForSyncAll) {
      setSyncAllCurrentAlbum(album.name);
      setSyncAllFileProgress({ total: 0, processed: 0, currentFile: null });

      try {
        const res = await fetch("/api/admin/drive/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: album.id }),
        });
        const json = await res.json();
        if (json.success && json.data?.jobId) {
          const jobId = json.data.jobId;

          // Poll dengan update progress Sync All
          const job = await new Promise<{ addedFiles: number; status: string }>((resolve) => {
            const INTERVAL = 2000;
            const MAX = 90;
            let attempts = 0;
            const check = async () => {
              attempts++;
              try {
                const r = await fetch(`/api/admin/drive/sync?jobId=${jobId}`);
                const j = await r.json();
                const jobData = j.data;
                if (!jobData) { resolve({ addedFiles: 0, status: "FAILED" }); return; }

                setSyncAllFileProgress({
                  total:       jobData.totalFiles ?? 0,
                  processed:   jobData.processedFiles ?? 0,
                  currentFile: jobData.currentFile ?? null,
                });

                if (["COMPLETED", "PARTIAL", "FAILED"].includes(jobData.status)) {
                  resolve(jobData);
                  return;
                }
              } catch { /* silent */ }
              if (attempts < MAX) setTimeout(check, INTERVAL);
              else resolve({ addedFiles: 0, status: "TIMEOUT" });
            };
            setTimeout(check, INTERVAL);
          });

          if (job.status === "COMPLETED" || job.status === "PARTIAL") {
            totalAdded += job.addedFiles ?? 0;
          } else {
            totalFailed++;
          }
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
    setSyncAllCurrentAlbum(null);
    setSyncAllFileProgress(null);
    router.refresh();
    alert(
      `Sync selesai!\n✓ ${totalAdded} foto baru` +
      (totalFailed > 0 ? `\n✗ ${totalFailed} album gagal` : "\nSemua album berhasil")
    );
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
          <div className="mt-4 space-y-2">
            {/* Album progress */}
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin text-green-500" />
                {syncAllCurrentAlbum
                  ? <span>Sync: <strong className="text-gray-700">{syncAllCurrentAlbum}</strong></span>
                  : <span>Menyinkronkan...</span>
                }
              </span>
              <span className="tabular-nums">{syncAllProgress.done} / {syncAllProgress.total} album</span>
            </div>
            {/* Album-level progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: syncAllProgress.total > 0 ? `${(syncAllProgress.done / syncAllProgress.total) * 100}%` : "0%" }}
              />
            </div>
            {/* File-level progress dalam album aktif */}
            {syncAllFileProgress && syncAllFileProgress.total > 0 && (
              <>
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FileImage size={10} />
                    {syncAllFileProgress.currentFile
                      ? <span className="truncate max-w-[240px]" title={syncAllFileProgress.currentFile}>
                          {syncAllFileProgress.currentFile}
                        </span>
                      : <span>Memproses file...</span>
                    }
                  </span>
                  <span className="tabular-nums shrink-0 ml-2">
                    {syncAllFileProgress.processed}/{syncAllFileProgress.total} file
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-400 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${(syncAllFileProgress.processed / syncAllFileProgress.total) * 100}%` }}
                  />
                </div>
              </>
            )}
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
                    {/* Hasil sync */}
                    {syncResults[album.id] && (
                      <p className={cn(
                        "text-xs mt-0.5 font-medium",
                        syncResults[album.id].startsWith("✓") ? "text-green-600"
                        : syncResults[album.id].startsWith("✗") ? "text-red-600"
                        : "text-blue-500"
                      )}>
                        {syncResults[album.id]}
                      </p>
                    )}
                    {/* Progress bar per-album saat sync */}
                    {syncProgress[album.id] && syncProgress[album.id].total > 0 && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileImage size={10} />
                            {syncProgress[album.id].currentFile
                              ? <span className="truncate max-w-[180px]" title={syncProgress[album.id].currentFile ?? undefined}>
                                  {syncProgress[album.id].currentFile}
                                </span>
                              : <span>Memproses...</span>
                            }
                          </span>
                          <span className="tabular-nums shrink-0 ml-1">
                            {syncProgress[album.id].processed}/{syncProgress[album.id].total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-brand-500 h-1.5 rounded-full transition-all duration-200"
                            style={{
                              width: `${Math.min(100, (syncProgress[album.id].processed / syncProgress[album.id].total) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
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
