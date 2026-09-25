"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, ChevronDown, ChevronRight, Loader2, RefreshCw,
  AlertCircle, CheckCircle, Pencil, Trash2, X, Save,
  ArrowUp, ArrowDown, EyeOff, Eye, Layers, FileImage, FolderSync,
} from "lucide-react";
import { generateSlug } from "@/lib/utils/slug";
import { formatNumber } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────────
interface Album {
  id: string;
  name: string;
  slug: string;
  driveFolderId: string | null;
  albumGroupId: string | null;
  sortOrder: number;
  status: "ACTIVE" | "HIDDEN";
  _count: { mediaFiles: number };
}

interface AlbumGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  status: "ACTIVE" | "HIDDEN";
  albums: Album[];
}

interface Day {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  _count: { mediaFiles: number };
  albums: Album[];
  albumGroups: AlbumGroup[];
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

// ─── Konstanta ───────────────────────────────────────────────
const emptyAlbumForm = { name: "", slug: "", driveFolderId: "", albumGroupId: "" };
const emptyGroupForm = { name: "", slug: "", description: "" };
const emptyDayForm = (nextDay: number) => ({ title: "", dayNumber: nextDay, description: "", date: "" });
const emptyImportForm = { dayFolderId: "" };
const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";

// ─── Component ───────────────────────────────────────────────
export function DayManager({ event, days }: DayManagerProps) {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string | null>(days[0]?.id ?? null);

  // Day state
  const [showAddDay, setShowAddDay] = useState(false);
  const [dayForm, setDayForm] = useState(emptyDayForm(days.length + 1));
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState("");
  const [daySuccess, setDaySuccess] = useState("");
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editDayForm, setEditDayForm] = useState({ title: "", description: "" });

  // Album state
  const [showAddAlbum, setShowAddAlbum] = useState<string | null>(null);   // dayId
  const [albumForm, setAlbumForm] = useState(emptyAlbumForm);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState("");
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editAlbumForm, setEditAlbumForm] = useState({ name: "", slug: "", driveFolderId: "", albumGroupId: "" });

  // Album Group state
  const [showAddGroup, setShowAddGroup] = useState<string | null>(null);   // dayId
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupForm, setEditGroupForm] = useState({ name: "", slug: "", description: "" });

  // Sync
  const [syncingAlbum, setSyncingAlbum] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<Record<string, string>>({});
  const [syncProgress, setSyncProgress] = useState<Record<string, {
    total: number; processed: number; currentFile: string | null;
  }>>({});

  // Loading states
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Import dari Drive state
  const [showImport, setShowImport] = useState<string | null>(null); // dayId
  const [importForm, setImportForm] = useState(emptyImportForm);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // ── POLL SYNC JOB ─────────────────────────────────────────
  const pollSyncJob = useCallback((albumId: string, jobId: string) => {
    const INTERVAL = 2000;
    const MAX = 180;  // 6 menit
    let attempts = 0;
    const check = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/admin/drive/sync?jobId=${jobId}`);
        const json = await res.json();
        const job = json.data;
        if (!job) { setSyncingAlbum(null); return; }

        // Update progress realtime
        if (job.totalFiles > 0) {
          setSyncProgress((prev) => ({
            ...prev,
            [albumId]: {
              total:       job.totalFiles,
              processed:   job.processedFiles ?? 0,
              currentFile: job.currentFile ?? null,
            },
          }));
        }

        if (job.status === "COMPLETED" || job.status === "PARTIAL") {
          setSyncResult((r) => ({ ...r, [albumId]: `✓ +${job.addedFiles} baru · ${job.updatedFiles} diperbarui · ${job.skippedFiles} skip` }));
          setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
          setSyncingAlbum(null);
          router.refresh();
          return;
        }
        if (job.status === "FAILED") {
          setSyncResult((r) => ({ ...r, [albumId]: `✗ Gagal: ${job.errorMessage ?? "Unknown"}` }));
          setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
          setSyncingAlbum(null);
          return;
        }
        if (attempts < MAX) {
          setSyncResult((r) => ({ ...r, [albumId]: `⏳ Sync berjalan...` }));
          setTimeout(check, INTERVAL);
        } else {
          setSyncResult((r) => ({ ...r, [albumId]: `⏳ Masih berjalan. Refresh untuk melihat hasilnya.` }));
          setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
          setSyncingAlbum(null);
        }
      } catch {
        setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
        setSyncingAlbum(null);
      }
    };
    setTimeout(check, INTERVAL);
  }, [router]);

  // ── SYNC ALBUM ────────────────────────────────────────────
  const handleSync = async (albumId: string) => {
    setSyncingAlbum(albumId);
    setSyncResult((r) => ({ ...r, [albumId]: "" }));
    setSyncProgress((p) => ({ ...p, [albumId]: { total: 0, processed: 0, currentFile: null } }));
    try {
      const res = await fetch("/api/admin/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });
      const json = await res.json();
      if (json.success && res.status === 202) {
        const jobId = json.data?.jobId;
        setSyncResult((r) => ({ ...r, [albumId]: `⏳ Sync berjalan...` }));
        if (jobId) pollSyncJob(albumId, jobId);
        else {
          setSyncResult((r) => ({ ...r, [albumId]: "✗ Tidak ada jobId" }));
          setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
          setSyncingAlbum(null);
        }
      } else {
        setSyncResult((r) => ({ ...r, [albumId]: `✗ ${json.error || "Sync gagal"}` }));
        setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
        setSyncingAlbum(null);
      }
    } catch {
      setSyncResult((r) => ({ ...r, [albumId]: "✗ Kesalahan jaringan" }));
      setSyncProgress((p) => { const n = { ...p }; delete n[albumId]; return n; });
      setSyncingAlbum(null);
    }
  };

  // ── ADD DAY ───────────────────────────────────────────────
  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setDayError("");
    setDayLoading(true);
    try {
      const res = await fetch("/api/admin/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dayForm, eventId: event.id, sortOrder: days.length, date: dayForm.date ? new Date(dayForm.date).toISOString() : null }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowAddDay(false);
        setDayForm(emptyDayForm(days.length + 2));
        setDaySuccess("✓ Hari berhasil ditambahkan!");
        setTimeout(() => setDaySuccess(""), 3000);
        router.refresh();
      } else setDayError(json.error || "Gagal menyimpan hari.");
    } catch { setDayError("Terjadi kesalahan jaringan."); }
    finally { setDayLoading(false); }
  };

  const handleEditDay = async (dayId: string) => {
    setSavingId(dayId);
    try {
      const res = await fetch(`/api/admin/days/${dayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editDayForm.title, description: editDayForm.description || null }),
      });
      if ((await res.json()).success) { setEditingDayId(null); router.refresh(); }
      else alert("Gagal menyimpan perubahan.");
    } catch { alert("Terjadi kesalahan jaringan."); }
    finally { setSavingId(null); }
  };

  const handleDeleteDay = async (dayId: string, title: string) => {
    if (!confirm(`Hapus "${title}" beserta semua album dan foto?\n\nTidak dapat dibatalkan.`)) return;
    setDeletingId(dayId);
    try {
      const res = await fetch(`/api/admin/days/${dayId}`, { method: "DELETE" });
      if ((await res.json()).success) router.refresh();
      else alert("Gagal menghapus hari.");
    } catch { alert("Terjadi kesalahan jaringan."); }
    finally { setDeletingId(null); }
  };

  // ── Import dari Drive (syncDayFolders) ───────────────────
  const handleImportFromDrive = async (e: React.FormEvent, dayId: string) => {
    e.preventDefault();
    if (!importForm.dayFolderId.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/drive/sync-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDayId: dayId, dayFolderId: importForm.dayFolderId.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const d = json.data;
        setImportResult(
          `✓ ${d.groupsCreated} grup baru · ${d.albumsCreated} album baru · ${d.albumsUpdated} album diperbarui`
        );
        router.refresh();
      } else {
        setImportResult(`✗ ${json.error || "Import gagal"}`);
      }
    } catch {
      setImportResult("✗ Kesalahan jaringan");
    } finally {
      setImportLoading(false);
    }
  };

  // ── ALBUM GROUP HANDLERS ──────────────────────────────────
  const handleAddGroup = async (e: React.FormEvent, dayId: string) => {
    e.preventDefault();
    setGroupError("");
    if (!groupForm.name.trim()) { setGroupError("Nama grup wajib diisi."); return; }
    if (!groupForm.slug.trim()) { setGroupError("Slug wajib diisi."); return; }
    setGroupLoading(true);
    try {
      const day = days.find((d) => d.id === dayId);
      const res = await fetch("/api/admin/album-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDayId: dayId,
          name: groupForm.name.trim(),
          slug: groupForm.slug.trim(),
          description: groupForm.description.trim() || undefined,
          sortOrder: day?.albumGroups.length ?? 0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) { setShowAddGroup(null); setGroupForm(emptyGroupForm); router.refresh(); }
      else setGroupError(json.error || "Gagal menyimpan grup.");
    } catch { setGroupError("Terjadi kesalahan jaringan."); }
    finally { setGroupLoading(false); }
  };

  const handleEditGroup = async (groupId: string) => {
    setSavingId(groupId);
    try {
      const res = await fetch(`/api/admin/album-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editGroupForm.name.trim(), slug: editGroupForm.slug.trim(), description: editGroupForm.description.trim() || null }),
      });
      if ((await res.json()).success) { setEditingGroupId(null); router.refresh(); }
      else alert("Gagal menyimpan perubahan.");
    } catch { alert("Terjadi kesalahan jaringan."); }
    finally { setSavingId(null); }
  };

  const handleDeleteGroup = async (groupId: string, name: string, albumCount: number) => {
    const msg = albumCount > 0
      ? `Hapus grup "${name}"?\n\n${albumCount} album di dalamnya akan dipindah ke Day tanpa grup (tidak terhapus).`
      : `Hapus grup "${name}"?`;
    if (!confirm(msg)) return;
    setDeletingId(groupId);
    try {
      const res = await fetch(`/api/admin/album-groups/${groupId}`, { method: "DELETE" });
      if ((await res.json()).success) router.refresh();
      else alert("Gagal menghapus grup.");
    } catch { alert("Terjadi kesalahan jaringan."); }
    finally { setDeletingId(null); }
  };

  const handleToggleGroup = async (groupId: string, currentStatus: "ACTIVE" | "HIDDEN") => {
    setTogglingId(groupId);
    try {
      const res = await fetch(`/api/admin/album-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentStatus === "ACTIVE" ? "HIDDEN" : "ACTIVE" }),
      });
      if ((await res.json()).success) router.refresh();
      else alert("Gagal mengubah status.");
    } catch { alert("Terjadi kesalahan jaringan."); }
    finally { setTogglingId(null); }
  };

  // ── ALBUM HANDLERS ────────────────────────────────────────
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
          albumGroupId: albumForm.albumGroupId || null,
          eventDayId: dayId,
          sortOrder: day?.albums.length ?? 0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) { setShowAddAlbum(null); setAlbumForm(emptyAlbumForm); router.refresh(); }
      else setAlbumError(json.error || "Gagal menyimpan album.");
    } catch { setAlbumError("Terjadi kesalahan jaringan."); }
    finally { setAlbumLoading(false); }
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
          albumGroupId: editAlbumForm.albumGroupId || null,
        }),
      });
      if ((await res.json()).success) { setEditingAlbumId(null); router.refresh(); }
      else alert("Gagal menyimpan perubahan.");
    } catch { alert("Terjadi kesalahan jaringan."); }
    finally { setSavingId(null); }
  };

  const handleDeleteAlbum = async (albumId: string, name: string) => {
    if (!confirm(`Hapus album "${name}" beserta semua fotonya?\n\nTidak dapat dibatalkan.`)) return;
    setDeletingId(albumId);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`, { method: "DELETE" });
      if ((await res.json()).success) router.refresh();
      else alert("Gagal menghapus album.");
    } catch { alert("Terjadi kesalahan jaringan."); }
    finally { setDeletingId(null); }
  };

  const handleMoveAlbum = async (dayId: string, albumId: string, direction: "up" | "down") => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    // Cari album yang dimove
    const targetAlbum = day.albums.find((a) => a.id === albumId);
    if (!targetAlbum) return;

    // Sort hanya dalam scope yang sama (grup atau flat)
    // Album dalam grup → bandingkan hanya dengan sesama album dalam grup yang sama
    // Album flat → bandingkan hanya dengan sesama album flat
    const scopeAlbums = day.albums
      .filter((a) => a.albumGroupId === targetAlbum.albumGroupId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const idx = scopeAlbums.findIndex((a) => a.id === albumId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= scopeAlbums.length) return;

    const [albumA, albumB] = [scopeAlbums[idx], scopeAlbums[swapIdx]];
    setReorderingId(albumId);
    try {
      await Promise.all([
        fetch(`/api/admin/albums/${albumA.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: albumB.sortOrder }) }),
        fetch(`/api/admin/albums/${albumB.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: albumA.sortOrder }) }),
      ]);
      router.refresh();
    } catch { alert("Gagal mengubah urutan album."); }
    finally { setReorderingId(null); }
  };

  const handleToggleAlbum = async (albumId: string, currentStatus: "ACTIVE" | "HIDDEN") => {
    setTogglingId(albumId);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentStatus === "ACTIVE" ? "HIDDEN" : "ACTIVE" }),
      });
      if ((await res.json()).success) router.refresh();
      else alert("Gagal mengubah status.");
    } catch { alert("Terjadi kesalahan jaringan."); }
    finally { setTogglingId(null); }
  };

  // ── RENDER ALBUM ROW ──────────────────────────────────────
  const renderAlbumRow = (album: Album, albumIdx: number, sortedAlbums: Album[], day: Day) => (
    <div key={album.id}>
      {editingAlbumId === album.id ? (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-yellow-700">Edit Album</p>
          <input type="text" value={editAlbumForm.name}
            onChange={(e) => setEditAlbumForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
            placeholder="Nama album" className={inputClass} autoFocus />
          <input type="text" value={editAlbumForm.slug}
            onChange={(e) => setEditAlbumForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
            placeholder="Slug" className={inputClass} />
          <input type="text" value={editAlbumForm.driveFolderId}
            onChange={(e) => setEditAlbumForm((f) => ({ ...f, driveFolderId: e.target.value.trim() }))}
            placeholder="Google Drive Folder ID (opsional)" className={inputClass} />
          {/* Assign ke grup */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Pindah ke Grup</label>
            <select
              value={editAlbumForm.albumGroupId}
              onChange={(e) => setEditAlbumForm((f) => ({ ...f, albumGroupId: e.target.value }))}
              className={inputClass}
            >
              <option value="">— Tanpa grup (langsung di Day) —</option>
              {day.albumGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleEditAlbum(album.id)} disabled={savingId === album.id}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
              {savingId === album.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Simpan
            </button>
            <button onClick={() => setEditingAlbumId(null)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2">
              <X size={12} /> Batal
            </button>
          </div>
        </div>
      ) : (
        <div className={cn(
          "flex items-center justify-between border rounded-lg px-3 py-2.5 hover:bg-gray-50",
          album.status === "HIDDEN" ? "border-gray-200 bg-gray-50/50 opacity-60" : "border-gray-100"
        )}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn("text-sm font-medium", album.status === "HIDDEN" ? "text-gray-400 line-through" : "text-gray-800")}>
                {album.name}
              </p>
              {album.status === "HIDDEN" && (
                <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">Hidden</span>
              )}
            </div>
            <p className="text-xs mt-0.5">
              {album.driveFolderId ? <span className="text-green-600">✓ Drive terhubung</span> : <span className="text-orange-500">Belum ada Drive Folder</span>}
              {" · "}<span className="text-gray-400">{formatNumber(album._count.mediaFiles)} foto</span>
            </p>
            {syncResult[album.id] && (
              <p className={cn("text-xs mt-0.5 font-medium",
                syncResult[album.id].startsWith("✓") ? "text-green-600"
                : syncResult[album.id].startsWith("✗") ? "text-red-500"
                : "text-blue-500")}>
                {syncResult[album.id]}
              </p>
            )}
            {/* Progress bar realtime saat sync */}
            {syncProgress[album.id] && syncProgress[album.id].total > 0 && (
              <div className="mt-1.5 space-y-0.5">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span className="flex items-center gap-1 min-w-0">
                    <FileImage size={9} className="shrink-0" />
                    <span className="truncate max-w-[140px]" title={syncProgress[album.id].currentFile ?? undefined}>
                      {syncProgress[album.id].currentFile ?? "Memproses..."}
                    </span>
                  </span>
                  <span className="tabular-nums shrink-0 ml-1">
                    {syncProgress[album.id].processed}/{syncProgress[album.id].total}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-brand-500 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(100, (syncProgress[album.id].processed / syncProgress[album.id].total) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button onClick={() => handleMoveAlbum(day.id, album.id, "up")} disabled={!!reorderingId || albumIdx === 0}
              className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed" title="Naikan">
              {reorderingId === album.id ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={12} />}
            </button>
            <button onClick={() => handleMoveAlbum(day.id, album.id, "down")} disabled={!!reorderingId || albumIdx === sortedAlbums.length - 1}
              className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed" title="Turunkan">
              <ArrowDown size={12} />
            </button>
            <button onClick={() => handleToggleAlbum(album.id, album.status)} disabled={togglingId === album.id}
              className={cn("p-1.5 rounded-lg transition-colors",
                album.status === "HIDDEN" ? "text-gray-400 hover:text-green-600 hover:bg-green-50" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50")}
              title={album.status === "HIDDEN" ? "Tampilkan" : "Sembunyikan"}>
              {togglingId === album.id ? <Loader2 size={13} className="animate-spin" /> : album.status === "HIDDEN" ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
            {album.driveFolderId && (
              <button onClick={() => handleSync(album.id)} disabled={!!syncingAlbum}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {syncingAlbum === album.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Sync
              </button>
            )}
            <button onClick={() => { setEditingAlbumId(album.id); setEditAlbumForm({ name: album.name, slug: album.slug, driveFolderId: album.driveFolderId ?? "", albumGroupId: album.albumGroupId ?? "" }); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
              <Pencil size={13} />
            </button>
            <button onClick={() => handleDeleteAlbum(album.id, album.name)} disabled={deletingId === album.id}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Hapus">
              {deletingId === album.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div key={day.id} className="border border-gray-100 rounded-xl overflow-hidden">
          {/* Day header */}
          {editingDayId === day.id ? (
            <div className="bg-yellow-50 border-b border-yellow-100 p-3 flex gap-2 flex-wrap">
              <input type="text" value={editDayForm.title}
                onChange={(e) => setEditDayForm((f) => ({ ...f, title: e.target.value }))}
                className="flex-1 min-w-[160px] border border-yellow-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                placeholder="Judul hari" autoFocus />
              <input type="text" value={editDayForm.description}
                onChange={(e) => setEditDayForm((f) => ({ ...f, description: e.target.value }))}
                className="flex-1 min-w-[120px] border border-yellow-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                placeholder="Deskripsi (opsional)" />
              <button onClick={() => handleEditDay(day.id)} disabled={savingId === day.id}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                {savingId === day.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Simpan
              </button>
              <button onClick={() => setEditingDayId(null)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2">
                <X size={12} /> Batal
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <button type="button" onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                className="flex-1 flex items-center gap-3 px-4 py-3 text-left">
                {expandedDay === day.id ? <ChevronDown size={15} className="text-gray-400 shrink-0" /> : <ChevronRight size={15} className="text-gray-400 shrink-0" />}
                <span className="font-medium text-gray-800 text-sm">{day.title}</span>
                <span className="text-xs text-gray-400">
                  {day.albumGroups.length > 0 && `${day.albumGroups.length} grup · `}
                  {day.albums.length} album · {formatNumber(day._count.mediaFiles)} foto
                </span>
              </button>
              <div className="flex items-center gap-1 pr-3">
                <button onClick={() => { setEditingDayId(day.id); setEditDayForm({ title: day.title, description: day.description ?? "" }); }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit hari">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDeleteDay(day.id, day.title)} disabled={deletingId === day.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Hapus hari">
                  {deletingId === day.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          )}

          {/* Body Day */}
          {expandedDay === day.id && (
            <div className="p-4 space-y-4 bg-white">

              {/* ── Album Groups ──────────────────────── */}
              {day.albumGroups.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Layers size={12} /> Grup Sesi
                  </p>
                  {[...day.albumGroups].sort((a, b) => a.sortOrder - b.sortOrder).map((group) => (
                    <div key={group.id} className="border border-blue-100 rounded-xl overflow-hidden">
                      {/* Group header */}
                      {editingGroupId === group.id ? (
                        <div className="bg-blue-50 p-3 flex gap-2 flex-wrap">
                          <input type="text" value={editGroupForm.name}
                            onChange={(e) => setEditGroupForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                            className="flex-1 min-w-[140px] border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            placeholder="Nama grup" autoFocus />
                          <input type="text" value={editGroupForm.slug}
                            onChange={(e) => setEditGroupForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                            className="w-32 border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            placeholder="slug" />
                          <button onClick={() => handleEditGroup(group.id)} disabled={savingId === group.id}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                            {savingId === group.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Simpan
                          </button>
                          <button onClick={() => setEditingGroupId(null)} className="flex items-center gap-1 text-xs text-gray-500 px-2">
                            <X size={12} /> Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center bg-blue-50 px-3 py-2.5 gap-2">
                          <Layers size={14} className="text-blue-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className={cn("text-sm font-semibold", group.status === "HIDDEN" ? "text-gray-400 line-through" : "text-blue-800")}>
                              {group.name}
                            </span>
                            <span className="text-xs text-blue-400 ml-2">{group.albums.length} album</span>
                            {group.status === "HIDDEN" && (
                              <span className="ml-2 text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Hidden</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleToggleGroup(group.id, group.status)} disabled={togglingId === group.id}
                              className={cn("p-1.5 rounded-lg transition-colors",
                                group.status === "HIDDEN" ? "text-gray-400 hover:text-green-600 hover:bg-green-50" : "text-blue-300 hover:text-orange-500 hover:bg-orange-50")}
                              title={group.status === "HIDDEN" ? "Tampilkan grup" : "Sembunyikan grup"}>
                              {togglingId === group.id ? <Loader2 size={12} className="animate-spin" /> : group.status === "HIDDEN" ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>
                            <button onClick={() => { setEditingGroupId(group.id); setEditGroupForm({ name: group.name, slug: group.slug, description: group.description ?? "" }); }}
                              className="p-1.5 text-blue-300 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit grup">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleDeleteGroup(group.id, group.name, group.albums.length)} disabled={deletingId === group.id}
                              className="p-1.5 text-blue-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Hapus grup">
                              {deletingId === group.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Albums dalam grup */}
                      {group.albums.length > 0 && (
                        <div className="px-3 py-2 space-y-1.5 bg-blue-50/30">
                          {[...group.albums].sort((a, b) => a.sortOrder - b.sortOrder).map((album, idx, arr) =>
                            renderAlbumRow(album, idx, arr, day)
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Album tanpa grup ──────────────────── */}
              {(() => {
                const flatAlbums = [...day.albums]
                  .filter((a) => !a.albumGroupId)
                  .sort((a, b) => a.sortOrder - b.sortOrder);
                return flatAlbums.length > 0 ? (
                  <div className="space-y-2">
                    {day.albumGroups.length > 0 && (
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Album Lainnya</p>
                    )}
                    {flatAlbums.map((album, idx, arr) => renderAlbumRow(album, idx, arr, day))}
                  </div>
                ) : null;
              })()}

              {/* ── Tombol tambah ─────────────────────── */}
              <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-100">

                {/* Import dari Drive */}
                {showImport === day.id ? (
                  <form onSubmit={(e) => handleImportFromDrive(e, day.id)}
                    className="w-full border border-purple-200 bg-purple-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                      <FolderSync size={12} /> Import dari Drive (scan sub-folder otomatis)
                    </p>
                    <p className="text-xs text-purple-500">
                      Sub-folder level 1 → Grup, level 2 → Album. Folder tanpa sub-folder → Album langsung.
                    </p>
                    <input type="text" placeholder="Drive Folder ID untuk Day ini"
                      value={importForm.dayFolderId}
                      onChange={(e) => setImportForm({ dayFolderId: e.target.value.trim() })}
                      required className={inputClass} />
                    {importResult && (
                      <p className={`text-xs font-medium ${importResult.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                        {importResult}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button type="submit" disabled={importLoading}
                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        {importLoading ? <Loader2 size={12} className="animate-spin" /> : <FolderSync size={12} />}
                        {importLoading ? "Mengimpor..." : "Import & Sync"}
                      </button>
                      <button type="button" onClick={() => { setShowImport(null); setImportResult(null); }}
                        className="text-xs text-gray-500 px-2">Batal</button>
                    </div>
                  </form>
                ) : (
                  <button type="button"
                    onClick={() => { setShowImport(day.id); setImportForm(emptyImportForm); setImportResult(null); }}
                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium py-1">
                    <FolderSync size={13} /> Import dari Drive
                  </button>
                )}

                {/* Tambah Grup */}
                {showAddGroup === day.id ? (
                  <form onSubmit={(e) => handleAddGroup(e, day.id)}
                    className="w-full border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      <Layers size={12} /> Tambah Grup Baru
                    </p>
                    {groupError && (
                      <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <AlertCircle size={12} /> {groupError}
                      </div>
                    )}
                    <input type="text" placeholder="Nama grup (contoh: Sesi 1)" value={groupForm.name}
                      onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                      required className={inputClass} />
                    <input type="text" placeholder="Slug" value={groupForm.slug}
                      onChange={(e) => setGroupForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                      required className={inputClass} />
                    <div className="flex gap-2">
                      <button type="submit" disabled={groupLoading}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        {groupLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        {groupLoading ? "Menyimpan..." : "Simpan Grup"}
                      </button>
                      <button type="button" onClick={() => { setShowAddGroup(null); setGroupError(""); }}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2">Batal</button>
                    </div>
                  </form>
                ) : (
                  <button type="button" onClick={() => { setShowAddGroup(day.id); setGroupForm(emptyGroupForm); setGroupError(""); }}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
                    <Plus size={13} /><Layers size={12} /> Tambah Grup
                  </button>
                )}

                {/* Tambah Album */}
                {showAddAlbum === day.id ? (
                  <form onSubmit={(e) => handleAddAlbum(e, day.id)}
                    className="w-full border border-brand-200 bg-brand-50/30 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-brand-700">Tambah Album Baru</p>
                    {albumError && (
                      <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <AlertCircle size={12} /> {albumError}
                      </div>
                    )}
                    <input type="text" placeholder="Nama album" value={albumForm.name}
                      onChange={(e) => setAlbumForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                      required className={inputClass} />
                    <input type="text" placeholder="Slug" value={albumForm.slug}
                      onChange={(e) => setAlbumForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                      required className={inputClass} />
                    <input type="text" placeholder="Google Drive Folder ID (opsional)" value={albumForm.driveFolderId}
                      onChange={(e) => setAlbumForm((f) => ({ ...f, driveFolderId: e.target.value.trim() }))}
                      className={inputClass} />
                    {/* Pilih Grup */}
                    {day.albumGroups.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Masukkan ke Grup (opsional)</label>
                        <select value={albumForm.albumGroupId}
                          onChange={(e) => setAlbumForm((f) => ({ ...f, albumGroupId: e.target.value }))}
                          className={inputClass}>
                          <option value="">— Tanpa grup —</option>
                          {day.albumGroups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="submit" disabled={albumLoading}
                        className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        {albumLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        {albumLoading ? "Menyimpan..." : "Simpan Album"}
                      </button>
                      <button type="button" onClick={() => { setShowAddAlbum(null); setAlbumError(""); }}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2">Batal</button>
                    </div>
                  </form>
                ) : (
                  <button type="button" onClick={() => { setShowAddAlbum(day.id); setAlbumForm(emptyAlbumForm); setAlbumError(""); }}
                    className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium py-1">
                    <Plus size={13} /> Tambah Album
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Success */}
      {daySuccess && (
        <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <CheckCircle size={14} /> {daySuccess}
        </div>
      )}

      {/* Add Day */}
      {showAddDay ? (
        <form onSubmit={handleAddDay} className="border border-brand-200 bg-brand-50/30 rounded-xl p-4 space-y-3 mt-2">
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
                onChange={(e) => setDayForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Judul <span className="text-red-500">*</span></label>
            <input type="text" placeholder="contoh: Day 1 — Qualification" value={dayForm.title}
              onChange={(e) => setDayForm((f) => ({ ...f, title: e.target.value }))} required className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={dayLoading}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
              {dayLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {dayLoading ? "Menyimpan..." : "Simpan Hari"}
            </button>
            <button type="button" onClick={() => { setShowAddDay(false); setDayError(""); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2">Batal</button>
          </div>
        </form>
      ) : (
        <button type="button"
          onClick={() => { setShowAddDay(true); setDayError(""); setDaySuccess(""); }}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2 py-1">
          <Plus size={16} /> Tambah Hari
        </button>
      )}
    </div>
  );
}
