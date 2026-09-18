"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils/slug";

interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  timezone: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
}

interface EventFormProps {
  event?: Event;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const isEditing = !!event;

  const [form, setForm] = useState({
    title: event?.title ?? "",
    slug: event?.slug ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    startDate: event?.startDate ? new Date(event.startDate).toISOString().slice(0, 10) : "",
    endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 10) : "",
    timezone: event?.timezone ?? "Asia/Jakarta",
    status: event?.status ?? "DRAFT",
    seoTitle: event?.seoTitle ?? "",
    seoDescription: event?.seoDescription ?? "",
    ogImageUrl: event?.ogImageUrl ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = (value: string) => {
    setForm((f) => ({
      ...f,
      title: value,
      slug: isEditing ? f.slug : generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        description: form.description || undefined,
        location: form.location || undefined,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        ogImageUrl: form.ogImageUrl || undefined,
      };

      const url = isEditing
        ? `/api/admin/events/${event.id}`
        : "/api/admin/events";

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Gagal menyimpan event");
        return;
      }

      if (!isEditing) {
        router.push(`/admin/dashboard/events/${json.data.id}`);
      }
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Judul Event <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className={inputClass}
            placeholder="Archery National Championship 2026"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Slug (URL) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <span className="text-sm text-gray-400 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl px-3 py-2.5 shrink-0">
              /e/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
              pattern="^[a-z0-9-]+$"
              className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="archery-national-2026"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Hanya huruf kecil, angka, dan tanda hubung
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Deskripsi
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className={inputClass}
            placeholder="Deskripsi singkat event..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className={inputClass}
            placeholder="Yogyakarta, Indonesia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
          <select
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            className={inputClass}
          >
            <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
            <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
            <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Mulai</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Selesai</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={inputClass}
          >
            <option value="DRAFT">Draft (tidak publik)</option>
            <option value="PUBLISHED">Published (publik)</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* SEO Section */}
      <details className="border border-gray-100 rounded-xl">
        <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
          SEO Settings (opsional)
        </summary>
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Title</label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
              className={inputClass}
              placeholder="Judul untuk mesin pencari (opsional)"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Description</label>
            <textarea
              value={form.seoDescription}
              onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
              rows={2}
              className={inputClass}
              placeholder="Deskripsi untuk mesin pencari (opsional)"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL Gambar Cover Event
            </label>
            <input
              type="url"
              value={form.ogImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, ogImageUrl: e.target.value }))}
              className={inputClass}
              placeholder="https://lh3.googleusercontent.com/... atau URL gambar lainnya"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tampil sebagai cover di kartu event di homepage. Bisa pakai URL dari Google Drive, CDN, atau mana saja.
            </p>
            {form.ogImageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden aspect-video relative border border-gray-100 bg-gray-900 max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.ogImageUrl}
                  alt="Preview cover"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>
        </div>
      </details>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {isEditing ? "Simpan Perubahan" : "Buat Event"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
