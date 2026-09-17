"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Save, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  bgColor: string;
  textColor: string;
  type: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
}

interface BannerManagerProps {
  banners: Banner[];
}

const POSITIONS = [
  { value: "HOME_TOP",        label: "Homepage — Atas" },
  { value: "HOME_BOTTOM",     label: "Homepage — Bawah" },
  { value: "GALLERY_TOP",     label: "Gallery — Atas" },
  { value: "GALLERY_BOTTOM",  label: "Gallery — Bawah" },
];

const TYPES = [
  { value: "PROMO",        label: "Promosi" },
  { value: "ANNOUNCEMENT", label: "Pengumuman" },
  { value: "SPONSOR",      label: "Sponsor" },
];

const emptyForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  linkLabel: "Selengkapnya",
  bgColor: "#1e293b",
  textColor: "#ffffff",
  type: "PROMO",
  position: "HOME_TOP",
  isActive: true,
  sortOrder: 0,
};

const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";

export function BannerManager({ banners }: BannerManagerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, sortOrder: banners.length });
    setShowForm(true);
  };

  const openEdit = (banner: Banner) => {
    setEditId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl ?? "",
      linkUrl: banner.linkUrl ?? "",
      linkLabel: banner.linkLabel ?? "Selengkapnya",
      bgColor: banner.bgColor,
      textColor: banner.textColor,
      type: banner.type,
      position: banner.position,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        subtitle: form.subtitle || null,
        imageUrl: form.imageUrl || null,
        linkUrl: form.linkUrl || null,
        linkLabel: form.linkLabel || null,
      };

      const url = editId ? `/api/admin/banners/${editId}` : "/api/admin/banners";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        setEditId(null);
        router.refresh();
      } else {
        const json = await res.json();
        alert(json.error || "Gagal menyimpan banner");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !banner.isActive }),
    });
    router.refresh();
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`Hapus banner "${banner.title}"?`)) return;
    setDeletingId(banner.id);
    try {
      await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  // Preview mini
  const Preview = () => (
    <div
      className="rounded-xl px-4 py-3 text-sm font-medium"
      style={{ backgroundColor: form.bgColor, color: form.textColor }}
    >
      <p className="font-bold">{form.title || "Judul Banner"}</p>
      {form.subtitle && <p className="text-xs opacity-80 mt-0.5">{form.subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Banner list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            {banners.length} Banner
          </h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Tambah Banner
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Belum ada banner. Klik "Tambah Banner" untuk membuat banner promosi.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {banners.map((banner) => (
              <div key={banner.id} className="flex items-center gap-4 px-6 py-4">
                {/* Color swatch */}
                <div
                  className="w-10 h-10 rounded-lg shrink-0"
                  style={{ backgroundColor: banner.bgColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{banner.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {POSITIONS.find(p => p.value === banner.position)?.label}
                    {" · "}
                    {TYPES.find(t => t.value === banner.type)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    banner.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {banner.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title={banner.isActive ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => openEdit(banner)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner)}
                    disabled={deletingId === banner.id}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Hapus"
                  >
                    {deletingId === banner.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              {editId ? "Edit Banner" : "Banner Baru"}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <Preview />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Judul <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Judul banner" className={inputClass} />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Subjudul</label>
              <input type="text" value={form.subtitle} onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Teks tambahan (opsional)" className={inputClass} />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">URL Gambar Background <span className="text-gray-400">(opsional)</span></label>
              <input type="url" value={form.imageUrl} onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className={inputClass} />
              <p className="text-xs text-gray-400 mt-0.5">Gambar sebagai background dengan overlay gelap</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">URL Link <span className="text-gray-400">(opsional)</span></label>
              <input type="text" value={form.linkUrl} onChange={(e) => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="/e/event-slug atau https://..." className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Label Tombol</label>
              <input type="text" value={form.linkLabel} onChange={(e) => setForm(f => ({ ...f, linkLabel: e.target.value }))} placeholder="Selengkapnya" className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Warna Background</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.bgColor} onChange={(e) => setForm(f => ({ ...f, bgColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <input type="text" value={form.bgColor} onChange={(e) => setForm(f => ({ ...f, bgColor: e.target.value }))} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Warna Teks</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.textColor} onChange={(e) => setForm(f => ({ ...f, textColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <input type="text" value={form.textColor} onChange={(e) => setForm(f => ({ ...f, textColor: e.target.value }))} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Posisi</label>
              <select value={form.position} onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))} className={inputClass}>
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tipe</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className={inputClass}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Urutan</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} min={0} className={inputClass} />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  form.isActive ? "bg-brand-600" : "bg-gray-200"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                  form.isActive ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
              <span className="text-xs text-gray-500">{form.isActive ? "Aktif" : "Nonaktif"}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading || !form.title.trim()}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {loading ? "Menyimpan..." : "Simpan Banner"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
