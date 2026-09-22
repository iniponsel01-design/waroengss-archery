"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Pencil,
  Trash2,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Eye,
} from "lucide-react";
import { generateSlug } from "@/lib/utils/slug";
import { formatNumber } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

interface Album {
  id: string;
  name: string;
  slug: string;
  driveFolderId: string | null;
  sortOrder: number;
  status: "ACTIVE" | "HIDDEN";
  _count: { mediaFiles: number };
}

interface Day {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  _count: { mediaFiles: number };
  albums: Album[];
}

interface Event {
  id: string;
  slug: string;
  title: string;
}

interface DayManagerProps {
  event: Event;
  days: Day[];
}

const emptyAlbumForm = { name: "", slug: "", driveFolderId: "" };
const emptyDayForm = (nextDay: number) => ({
  title: "",
  dayNumber: nextDay,
  description: "",
  date: "",
});

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";

export function DayManager({ event, days }: DayManagerProps) {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string | null>(days[0]?.id ?? null);

  // Add Day
  const [showAddDay, setShowAddDay] = useState(false);
  const [dayForm, setDayForm] = useState(emptyDayForm(days.length + 1));
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState("");
  const [daySuccess, setDaySuccess] = useState("");

  // Edit Day
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editDayForm, setEditDayForm] = useState({ title: "", description: "" });

  // Add Album
  const [showAddAlbum, setShowAddAlbum] = useState<string | null>(null);
  const [albumForm, setAlbumForm] = useState(emptyAlbumForm);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState("");

  // Edit Album
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editAlbumForm, setEditAlbumForm] = useState({ name: "", slug: "", driveFolderId: "" });

  // Sync
  const [syncingAlbum, setSyncingAlbum] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<Record<string, string>>({});

  // Loading states
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Add Day ────────────────────────────────────────────────
  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setDayError("");
    setDayLoading(true);
    try {
      const res = await fetch("/api/admin/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dayForm,
          eventId: event.id,
          sortOrder: days.length,
          date: dayForm.date ? new Date(dayForm.date).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowAddDay(false);
        setDayForm(emptyDayForm(days.length + 2));
        setDaySuccess("✓ Hari berhasil ditambahkan!");
        setTimeout(() => setDaySuccess(""), 3000);
        router.refresh();
      } else {
        setDayError(json.error || "Gagal menyimpan hari.");
      }
    } catch {
      setDayError("Terjadi kesalahan jaringan.");
    } finally {
      setDayLoading(false);
    }
  };

  // ── Edit Day ───────────────────────────────────────────────
  const startEditDay = (day: Day) => {
    setEditingDayId(day.id);
    setEditDayForm({ title: day.title, description: day.description ?? "" });
  };

  const handleEditDay = async (dayId: string) => {
    setSavingId(dayId);
    try {
      const res = await fetch(`/api/admin/days/${dayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editDayForm.title,
          description: editDayForm.description || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setEditingDayId(null);
        router.refresh();
      } else {
        alert(json.error || "Gagal menyimpan perubahan.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSavingId(null);
    }
  };

  // ── Delete Day ─────────────────────────────────────────────
  const handleDeleteDay = async (dayId: string, dayTitle: string) => {
    if (!confirm(`Hapus "${dayTitle}" beserta semua album dan foto?\n\nTindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(dayId);
    try {
      const res = await fetch(`/api/admin/days/${dayId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        router.refresh();
      } else {
        alert(json.error || "Gagal menghapus hari.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Add Album ──────────────────────────────────────────────
  const openAddAlbum = (dayId: string) => {
    setShowAddAlbum(dayId);
    setAlbumForm(emptyAlbumForm);
    setAlbumError("");
  };

  const handleAddAlbum = async (e: React.FormEvent, dayId: string) => {
    e.preventDefault();
    setAlbumError("");
    if (!albumForm.name.trim()) { setAlbumError("Nama album wajib diisi."); return; }
    if (!albumForm.slug.trim()) { setAlbumError("Slug wajib diisi."); return; }

    setAlbumLoading(true);
    try {
      const day = days.find((d) => d.id === dayId);
      const res = await fetch("/api/admin/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: albumForm.name.trim(),
          slug: albumForm.slug.trim(),
          driveFolderId: albumForm.driveFolderId.trim() || null,
          eventDayId: dayId,
          sortOrder: day?.albums.length ?? 0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowAddAlbum(null);
        setAlbumForm(emptyAlbumForm);
        router.refresh();
      } else {
        setAlbumError(json.error || "Gagal menyimpan album.");
      }
    } catch {
      setAlbumError("Terjadi kesalahan jaringan.");
    } finally {
      setAlbumLoading(false);
    }
  };

  // ── Edit Album ─────────────────────────────────────────────
  const startEditAlbum = (album: Album) => {
    setEditingAlbumId(album.id);
    setEditAlbumForm({
      name: album.name,
      slug: album.slug,
      driveFolderId: album.driveFolderId ?? "",
    });
  };

  const handleEditAlbum = async (albumId: string) => {
    setSavingId(albumId);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editAlbumForm.name.trim(),
          slug: editAlbumForm.slug.trim(),
          driveFolderId: editAlbumForm.driveFolderId.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setEditingAlbumId(null);
        router.refresh();
      } else {
        alert(json.error || "Gagal menyimpan perubahan.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSavingId(null);
    }
  };

  // ── Delete Album ───────────────────────────────────────────
  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    if (!confirm(`Hapus album "${albumName}" beserta semua fotonya?\n\nTindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(albumId);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        router.refresh();
      } else {
        alert(json.error || "Gagal menghapus album.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Reorder Album (move up / down) ────────────────────────
  const handleMoveAlbum = async (dayId: string, albumId: string, direction: "up" | "down") => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    const sorted = [...day.albums].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((a) => a.id === albumId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const albumA = sorted[idx];
    const albumB = sorted[swapIdx];
    const newOrderA = albumB.sortOrder;
    const newOrderB = albumA.sortOrder;

    setReorderingId(albumId);
    try {
      await Promise.all([
        fetch(`/api/admin/albums/${albumA.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: newOrderA }),
        }),
        fetch(`/api/admin/albums/${albumB.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: newOrderB }),
        }),
      ]);
      router.refresh();
    } catch {
      alert("Gagal mengubah urutan album.");
    } finally {
      setReorderingId(null);
    }
  };

  // ── Toggle Album Visibility ────────────────────────────────
  const handleToggleAlbum = async (albumId: string, currentStatus: "ACTIVE" | "HIDDEN") => {
    const newStatus = currentStatus === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    setTogglingId(albumId);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) alert(json.error || "Gagal mengubah status.");
      else router.refresh();
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Sync ───────────────────────────────────────────────────
  const handleSync = async (albumId: string) => {
    setSyncingAlbum(albumId);
    setSyncResult((r) => ({ ...r, [albumId]: "" }));
    try {
      const res = await fetch("/api/admin/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });
      const json = await res.json();
      if (json.success) {
        if (res.status === 202) {
          // Async job — poll status
          const jobId = json.data?.jobId;
          setSyncResult((r) => ({
            ...r,
            [albumId]: `⏳ Sync berjalan... (Job: ${jobId?.slice(-6) ?? "?"})`,
          }));
          if (jobId) {
            pollSyncJob(albumId, jobId);
            // setSyncingAlbum(null) dipanggil oleh pollSyncJob setelah selesai
          } else {
            // jobId tidak ada — selesaikan state sekarang
            setSyncResult((r) => ({ ...r, [albumId]: "✗ Tidak ada jobId dari server" }));
            setSyncingAlbum(null);
          }
        } else {
          // Fallback (tidak seharusnya terjadi — API selalu 202)
          setSyncResult((r) => ({ ...r, [albumId]: "✗ Respons tidak terduga dari server" }));
          setSyncingAlbum(null);
        }
      } else {
        setSyncResult((r) => ({ ...r, [albumId]: `✗ ${json.error || "Sync gagal"}` }));
        setSyncingAlbum(null);
      }
    } catch {
      setSyncResult((r) => ({ ...r, [albumId]: "✗ Kesalahan jaringan" }));
      setSyncingAlbum(null);
    }
    // ← tidak ada finally setSyncingAlbum(null) di sini —
    //   state diselesaikan di masing-masing branch atau di pollSyncJob
  };

  const pollSyncJob = (albumId: string, jobId: string) => {
    const INTERVAL = 3000;
    const MAX = 60; // konsisten dengan SyncManager (3 menit)
    let attempts = 0;
    const check = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/admin/drive/sync?jobId=${jobId}`);
        const json = await res.json();
        const job = json.data;
        if (!job) {
          setSyncingAlbum(null);
          return;
        }
        if (job.status === "COMPLETED" || job.status === "PARTIAL") {
          setSyncResult((r) => ({
            ...r,
            [albumId]: `✓ +${job.addedFiles} baru · ${job.updatedFiles} diperbarui · ${job.skippedFiles} skip`,
          }));
          setSyncingAlbum(null);  // ← tombol Sync aktif kembali setelah benar-benar selesai
          router.refresh();
          return;
        }
        if (job.status === "FAILED") {
          setSyncResult((r) => ({
            ...r,
            [albumId]: `✗ Gagal: ${job.errorMessage ?? "Unknown"}`,
          }));
          setSyncingAlbum(null);  // ← aktif kembali agar bisa retry
          return;
        }
        // QUEUED / RUNNING — lanjut poll
        if (attempts < MAX) {
          setSyncResult((r) => ({
            ...r,
            [albumId]: `⏳ ${job.status}... (+${job.addedFiles ?? 0} sejauh ini)`,
          }));
          setTimeout(check, INTERVAL);
        } else {
          // Timeout polling — biarkan user refresh manual
          setSyncResult((r) => ({
            ...r,
            [albumId]: `⏳ Masih berjalan di background. Refresh halaman untuk melihat hasilnya.`,
          }));
          setSyncingAlbum(null);  // ← aktif kembali agar tidak stuck selamanya
        }
      } catch {
        // Polling error — jangan stuck, aktifkan tombol kembali
        setSyncingAlbum(null);
      }
    };
    setTimeout(check, INTERVAL);
  };

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div key={day.id} className="border border-gray-100 rounded-xl overflow-hidden">
          {/* Day header */}
          {editingDayId === day.id ? (
            /* Edit Day inline */
            <div className="bg-yellow-50 border-b border-yellow-100 p-3 flex gap-2 flex-wrap">
              <input
                type="text"
                value={editDayForm.title}
                onChange={(e) => setEditDayForm((f) => ({ ...f, title: e.target.value }))}
                className="flex-1 min-w-[160px] border border-yellow-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                placeholder="Judul hari"
                autoFocus
              />
              <input
                type="text"
                value={editDayForm.description}
                onChange={(e) => setEditDayForm((f) => ({ ...f, description: e.target.value }))}
                className="flex-1 min-w-[120px] border border-yellow-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                placeholder="Deskripsi (opsional)"
              />
              <button
                onClick={() => handleEditDay(day.id)}
                disabled={savingId === day.id}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                {savingId === day.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Simpan
              </button>
              <button
                onClick={() => setEditingDayId(null)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2"
              >
                <X size={12} /> Batal
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <button
                type="button"
                onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
              >
                {expandedDay === day.id
                  ? <ChevronDown size={15} className="text-gray-400 shrink-0" />
                  : <ChevronRight size={15} className="text-gray-400 shrink-0" />
                }
                <span className="font-medium text-gray-800 text-sm">{day.title}</span>
                <span className="text-xs text-gray-400">
                  {day.albums.length} album · {formatNumber(day._count.mediaFiles)} foto
                </span>
              </button>
              {/* Edit + Delete day */}
              <div className="flex items-center gap-1 pr-3">
                <button
                  onClick={() => startEditDay(day)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit hari"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDeleteDay(day.id, day.title)}
                  disabled={deletingId === day.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Hapus hari"
                >
                  {deletingId === day.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          )}

          {/* Albums */}
          {expandedDay === day.id && (
            <div className="p-4 space-y-2 bg-white">
              {[...day.albums].sort((a, b) => a.sortOrder - b.sortOrder).map((album, albumIdx, sortedAlbums) => (
                <div key={album.id}>
                  {editingAlbumId === album.id ? (
                    /* Edit Album inline */
                    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-yellow-700">Edit Album</p>
                      <input
                        type="text"
                        value={editAlbumForm.name}
                        onChange={(e) => setEditAlbumForm((f) => ({
                          ...f, name: e.target.value,
                          slug: generateSlug(e.target.value),
                        }))}
                        placeholder="Nama album"
                        className={inputClass}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editAlbumForm.slug}
                        onChange={(e) => setEditAlbumForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                        placeholder="Slug"
                        className={inputClass}
                      />
                      <div>
                        <input
                          type="text"
                          value={editAlbumForm.driveFolderId}
                          onChange={(e) => setEditAlbumForm((f) => ({ ...f, driveFolderId: e.target.value.trim() }))}
                          placeholder="Google Drive Folder ID"
                          className={inputClass}
                        />
                        <p className="text-xs text-gray-400 mt-0.5">
                          Dari URL: drive.google.com/drive/folders/<strong>ID</strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAlbum(album.id)}
                          disabled={savingId === album.id}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          {savingId === album.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingAlbumId(null)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2"
                        >
                          <X size={12} /> Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Album row */
                    <div className={cn(
                      "flex items-center justify-between border rounded-lg px-3 py-2.5 hover:bg-gray-50",
                      album.status === "HIDDEN"
                        ? "border-gray-200 bg-gray-50/50 opacity-60"
                        : "border-gray-100"
                    )}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-medium",
                            album.status === "HIDDEN" ? "text-gray-400 line-through" : "text-gray-800"
                          )}>
                            {album.name}
                          </p>
                          {album.status === "HIDDEN" && (
                            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5">
                          {album.driveFolderId
                            ? <span className="text-green-600">✓ Drive terhubung</span>
                            : <span className="text-orange-500">Belum ada Drive Folder</span>
                          }
                          {" · "}
                          <span className="text-gray-400">{formatNumber(album._count.mediaFiles)} foto</span>
                        </p>
                        {syncResult[album.id] && (
                          <p className={cn("text-xs mt-0.5 font-medium",
                            syncResult[album.id].startsWith("✓") ? "text-green-600"
                            : syncResult[album.id].startsWith("✗") ? "text-red-500"
                            : "text-blue-500"
                          )}>
                            {syncResult[album.id]}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Move Up */}
                        <button
                          onClick={() => handleMoveAlbum(day.id, album.id, "up")}
                          disabled={!!reorderingId || albumIdx === 0}
                          className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Naikan urutan"
                        >
                          {reorderingId === album.id ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={12} />}
                        </button>
                        {/* Move Down */}
                        <button
                          onClick={() => handleMoveAlbum(day.id, album.id, "down")}
                          disabled={!!reorderingId || albumIdx === sortedAlbums.length - 1}
                          className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Turunkan urutan"
                        >
                          <ArrowDown size={12} />
                        </button>
                        {/* Toggle Hide/Show */}
                        <button
                          onClick={() => handleToggleAlbum(album.id, album.status)}
                          disabled={togglingId === album.id}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            album.status === "HIDDEN"
                              ? "text-gray-400 hover:text-green-600 hover:bg-green-50"
                              : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                          )}
                          title={album.status === "HIDDEN" ? "Tampilkan album" : "Sembunyikan album"}
                        >
                          {togglingId === album.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : album.status === "HIDDEN"
                              ? <Eye size={13} />
                              : <EyeOff size={13} />
                          }
                        </button>
                        {/* Sync */}
                        {album.driveFolderId && (
                          <button
                            onClick={() => handleSync(album.id)}
                            disabled={!!syncingAlbum}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {syncingAlbum === album.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            Sync
                          </button>
                        )}
                        {/* Edit */}
                        <button
                          onClick={() => startEditAlbum(album)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit album"
                        >
                          <Pencil size={13} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteAlbum(album.id, album.name)}
                          disabled={deletingId === album.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus album"
                        >
                          {deletingId === album.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Album form */}
              {showAddAlbum === day.id ? (
                <form
                  onSubmit={(e) => handleAddAlbum(e, day.id)}
                  className="border border-brand-200 bg-pink-50 rounded-lg p-3 space-y-2 mt-2"
                >
                  <p className="text-xs font-semibold text-brand-700">Tambah Album Baru</p>
                  {albumError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle size={12} /> {albumError}
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Nama Album <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="contoh: Qualification"
                      value={albumForm.name}
                      onChange={(e) => setAlbumForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Slug <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={albumForm.slug}
                      onChange={(e) => setAlbumForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Google Drive Folder ID <span className="text-gray-400">(opsional)</span></label>
                    <input
                      type="text"
                      placeholder="contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs"
                      value={albumForm.driveFolderId}
                      onChange={(e) => setAlbumForm((f) => ({ ...f, driveFolderId: e.target.value.trim() }))}
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">
                      URL Drive: drive.google.com/drive/folders/<strong>ID_ADA_DI_SINI</strong>
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={albumLoading}
                      className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {albumLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      {albumLoading ? "Menyimpan..." : "Simpan Album"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddAlbum(null); setAlbumError(""); }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => openAddAlbum(day.id)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium mt-1 py-1"
                >
                  <Plus size={13} /> Tambah Album
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Success message */}
      {daySuccess && (
        <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <CheckCircle size={14} /> {daySuccess}
        </div>
      )}

      {/* Add Day form */}
      {showAddDay ? (
        <form
          onSubmit={handleAddDay}
          className="border border-brand-200 bg-pink-50 rounded-xl p-4 space-y-3 mt-2"
        >
          <p className="text-sm font-semibold text-brand-700">Tambah Hari Baru</p>
          {dayError && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {dayError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Nomor Hari <span className="text-red-500">*</span></label>
              <input type="number" value={dayForm.dayNumber}
                onChange={(e) => setDayForm((f) => ({ ...f, dayNumber: parseInt(e.target.value) || 1 }))}
                required min={1} max={365} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Tanggal</label>
              <input type="date" value={dayForm.date}
                onChange={(e) => setDayForm((f) => ({ ...f, date: e.target.value }))}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Judul <span className="text-red-500">*</span></label>
            <input type="text" placeholder="contoh: Day 1 — Qualification"
              value={dayForm.title}
              onChange={(e) => setDayForm((f) => ({ ...f, title: e.target.value }))}
              required className={inputClass} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={dayLoading}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {dayLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {dayLoading ? "Menyimpan..." : "Simpan Hari"}
            </button>
            <button type="button" onClick={() => { setShowAddDay(false); setDayError(""); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2">
              Batal
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => { setShowAddDay(true); setDayError(""); setDaySuccess(""); }}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2 py-1"
        >
          <Plus size={16} /> Tambah Hari
        </button>
      )}
    </div>
  );
}
