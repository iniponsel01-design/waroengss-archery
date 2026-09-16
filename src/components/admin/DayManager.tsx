"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronRight, Loader2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { generateSlug } from "@/lib/utils/slug";
import { formatNumber } from "@/lib/utils/date";

interface Album {
  id: string;
  name: string;
  slug: string;
  driveFolderId: string | null;
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

export function DayManager({ event, days }: DayManagerProps) {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string | null>(days[0]?.id ?? null);

  // Day form state
  const [showAddDay, setShowAddDay] = useState(false);
  const [dayForm, setDayForm] = useState(emptyDayForm(days.length + 1));
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState("");
  const [daySuccess, setDaySuccess] = useState("");

  // Album form state — per day ID
  const [showAddAlbum, setShowAddAlbum] = useState<string | null>(null);
  const [albumForm, setAlbumForm] = useState(emptyAlbumForm);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState("");

  // Sync state
  const [syncingAlbum, setSyncingAlbum] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<Record<string, string>>({});

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";

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
        setDaySuccess(`✓ Hari berhasil ditambahkan!`);
        setTimeout(() => setDaySuccess(""), 3000);
        router.refresh();
      } else {
        setDayError(json.error || "Gagal menyimpan hari. Coba lagi.");
      }
    } catch {
      setDayError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setDayLoading(false);
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

    if (!albumForm.name.trim()) {
      setAlbumError("Nama album wajib diisi.");
      return;
    }
    if (!albumForm.slug.trim()) {
      setAlbumError("Slug wajib diisi.");
      return;
    }

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
        setAlbumError(json.error || "Gagal menyimpan album. Coba lagi.");
      }
    } catch {
      setAlbumError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setAlbumLoading(false);
    }
  };

  // ── Sync ───────────────────────────────────────────────────
  const handleSync = async (albumId: string, albumName: string) => {
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
        const j = json.data;
        setSyncResult((r) => ({
          ...r,
          [albumId]: `✓ +${j.addedFiles} baru · ${j.updatedFiles} diperbarui · ${j.deletedFiles} dihapus`,
        }));
        router.refresh();
      } else {
        setSyncResult((r) => ({ ...r, [albumId]: `✗ ${json.error || "Sync gagal"}` }));
      }
    } catch {
      setSyncResult((r) => ({ ...r, [albumId]: "✗ Kesalahan jaringan" }));
    } finally {
      setSyncingAlbum(null);
    }
  };

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div key={day.id} className="border border-gray-100 rounded-xl overflow-hidden">
          {/* Day header */}
          <button
            type="button"
            onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              {expandedDay === day.id
                ? <ChevronDown size={16} className="text-gray-500 shrink-0" />
                : <ChevronRight size={16} className="text-gray-500 shrink-0" />
              }
              <span className="font-medium text-gray-800 text-sm">{day.title}</span>
              <span className="text-xs text-gray-400">
                {day.albums.length} album · {formatNumber(day._count.mediaFiles)} foto
              </span>
            </div>
          </button>

          {/* Day content */}
          {expandedDay === day.id && (
            <div className="p-4 space-y-2 bg-white">
              {/* Album list */}
              {day.albums.map((album) => (
                <div key={album.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{album.name}</p>
                    <p className="text-xs mt-0.5">
                      {album.driveFolderId ? (
                        <span className="text-green-600">✓ Drive terhubung</span>
                      ) : (
                        <span className="text-orange-500">Belum ada folder Drive</span>
                      )}
                      {" · "}
                      <span className="text-gray-400">{formatNumber(album._count.mediaFiles)} foto</span>
                    </p>
                    {syncResult[album.id] && (
                      <p className={`text-xs mt-0.5 font-medium ${syncResult[album.id].startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                        {syncResult[album.id]}
                      </p>
                    )}
                  </div>
                  {album.driveFolderId && (
                    <button
                      type="button"
                      onClick={() => handleSync(album.id, album.name)}
                      disabled={syncingAlbum === album.id}
                      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0 ml-2"
                    >
                      {syncingAlbum === album.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <RefreshCw size={12} />
                      }
                      {syncingAlbum === album.id ? "Syncing..." : "Sync"}
                    </button>
                  )}
                </div>
              ))}

              {/* Add Album form */}
              {showAddAlbum === day.id ? (
                <form
                  onSubmit={(e) => handleAddAlbum(e, day.id)}
                  className="border border-brand-200 bg-pink-50 rounded-lg p-3 space-y-2 mt-2"
                >
                  <p className="text-xs font-semibold text-brand-700 mb-1">Tambah Album Baru</p>

                  {albumError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle size={12} />
                      {albumError}
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Nama Album <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="contoh: Qualification"
                      value={albumForm.name}
                      onChange={(e) =>
                        setAlbumForm((f) => ({
                          ...f,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        }))
                      }
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Slug <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="contoh: qualification"
                      value={albumForm.slug}
                      onChange={(e) => setAlbumForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                      required
                      pattern="^[a-z0-9-]+$"
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">Huruf kecil, angka, tanda hubung</p>
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
                      Dari URL Google Drive: drive.google.com/drive/folders/<strong>ID_ADA_DI_SINI</strong>
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={albumLoading}
                      className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {albumLoading
                        ? <><Loader2 size={12} className="animate-spin" /> Menyimpan...</>
                        : <><CheckCircle size={12} /> Simpan Album</>
                      }
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
                  <Plus size={13} />
                  Tambah Album
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add Day form */}
      {showAddDay ? (
        <form
          onSubmit={handleAddDay}
          className="border border-brand-200 bg-pink-50 rounded-xl p-4 space-y-3 mt-2"
        >
          <p className="text-sm font-semibold text-brand-700">Tambah Hari Baru</p>

          {daySuccess && (
            <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle size={14} />
              {daySuccess}
            </div>
          )}

          {dayError && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              {dayError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Nomor Hari <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={dayForm.dayNumber}
                onChange={(e) => setDayForm((f) => ({ ...f, dayNumber: parseInt(e.target.value) || 1 }))}
                required
                min={1}
                max={365}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Tanggal</label>
              <input
                type="date"
                value={dayForm.date}
                onChange={(e) => setDayForm((f) => ({ ...f, date: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Judul <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="contoh: Day 1 — Qualification"
              value={dayForm.title}
              onChange={(e) => setDayForm((f) => ({ ...f, title: e.target.value }))}
              required
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={dayLoading}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {dayLoading
                ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
                : <><CheckCircle size={14} /> Simpan Hari</>
              }
            </button>
            <button
              type="button"
              onClick={() => { setShowAddDay(false); setDayError(""); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2"
            >
              Batal
            </button>
          </div>
        </form>
      ) : (
        <>
          {daySuccess && (
            <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mt-2">
              <CheckCircle size={14} />
              {daySuccess}
            </div>
          )}
          <button
            type="button"
            onClick={() => { setShowAddDay(true); setDayError(""); setDaySuccess(""); }}
            className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2 py-1"
          >
            <Plus size={16} />
            Tambah Hari
          </button>
        </>
      )}
    </div>
  );
}
