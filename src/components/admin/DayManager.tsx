"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
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

export function DayManager({ event, days }: DayManagerProps) {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string | null>(days[0]?.id ?? null);
  const [showAddDay, setShowAddDay] = useState(false);
  const [showAddAlbum, setShowAddAlbum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncingAlbum, setSyncingAlbum] = useState<string | null>(null);

  // Add Day form
  const [dayForm, setDayForm] = useState({ title: "", dayNumber: days.length + 1, description: "", date: "" });

  // Add Album form
  const [albumForm, setAlbumForm] = useState({ name: "", slug: "", driveFolderId: "" });

  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dayForm, eventId: event.id, sortOrder: days.length }),
      });
      if (res.ok) {
        setShowAddDay(false);
        setDayForm({ title: "", dayNumber: days.length + 2, description: "", date: "" });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async (e: React.FormEvent, dayId: string) => {
    e.preventDefault();
    setLoading(true);
    try {
      const day = days.find((d) => d.id === dayId);
      const res = await fetch("/api/admin/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...albumForm,
          eventDayId: dayId,
          driveFolderId: albumForm.driveFolderId || null,
          sortOrder: day?.albums.length ?? 0,
        }),
      });
      if (res.ok) {
        setShowAddAlbum(null);
        setAlbumForm({ name: "", slug: "", driveFolderId: "" });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (albumId: string) => {
    setSyncingAlbum(albumId);
    try {
      const res = await fetch("/api/admin/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });
      const json = await res.json();
      if (json.success) {
        router.refresh();
      } else {
        alert(json.error || "Sync gagal");
      }
    } finally {
      setSyncingAlbum(null);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div key={day.id} className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedDay === day.id ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
              <span className="font-medium text-gray-800 text-sm">{day.title}</span>
              <span className="text-xs text-gray-400">
                {day.albums.length} album · {formatNumber(day._count.mediaFiles)} foto
              </span>
            </div>
          </button>

          {expandedDay === day.id && (
            <div className="p-4 space-y-2">
              {day.albums.map((album) => (
                <div
                  key={album.id}
                  className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{album.name}</p>
                    <p className="text-xs text-gray-400">
                      {album.driveFolderId ? (
                        <span className="text-green-600">Drive terhubung</span>
                      ) : (
                        <span className="text-orange-500">Belum ada folder Drive</span>
                      )}{" "}
                      · {formatNumber(album._count.mediaFiles)} foto
                    </p>
                  </div>
                  {album.driveFolderId && (
                    <button
                      onClick={() => handleSync(album.id)}
                      disabled={syncingAlbum === album.id}
                      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {syncingAlbum === album.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      Sync
                    </button>
                  )}
                </div>
              ))}

              {/* Add Album form */}
              {showAddAlbum === day.id ? (
                <form
                  onSubmit={(e) => handleAddAlbum(e, day.id)}
                  className="border border-brand-200 bg-brand-50 rounded-lg p-3 space-y-2"
                >
                  <input
                    type="text"
                    placeholder="Nama album"
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
                  <input
                    type="text"
                    placeholder="Slug (auto-generate)"
                    value={albumForm.slug}
                    onChange={(e) => setAlbumForm((f) => ({ ...f, slug: e.target.value }))}
                    required
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Google Drive Folder ID (opsional)"
                    value={albumForm.driveFolderId}
                    onChange={(e) => setAlbumForm((f) => ({ ...f, driveFolderId: e.target.value }))}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-1.5 bg-brand-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                    >
                      {loading && <Loader2 size={12} className="animate-spin" />}
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAlbum(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddAlbum(day.id)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 mt-1"
                >
                  <Plus size={12} />
                  Tambah Album
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add Day */}
      {showAddDay ? (
        <form
          onSubmit={handleAddDay}
          className="border border-brand-200 bg-brand-50 rounded-xl p-4 space-y-3"
        >
          <h4 className="text-sm font-medium text-gray-800">Tambah Hari</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Nomor hari"
              value={dayForm.dayNumber}
              onChange={(e) => setDayForm((f) => ({ ...f, dayNumber: parseInt(e.target.value) }))}
              required
              min={1}
              className={inputClass}
            />
            <input
              type="date"
              value={dayForm.date}
              onChange={(e) => setDayForm((f) => ({ ...f, date: e.target.value }))}
              className={inputClass}
            />
          </div>
          <input
            type="text"
            placeholder="Judul hari (misal: Day 1 — Qualification)"
            value={dayForm.title}
            onChange={(e) => setDayForm((f) => ({ ...f, title: e.target.value }))}
            required
            className={inputClass}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Simpan Hari
            </button>
            <button
              type="button"
              onClick={() => setShowAddDay(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Batal
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddDay(true)}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2"
        >
          <Plus size={16} />
          Tambah Hari
        </button>
      )}
    </div>
  );
}
