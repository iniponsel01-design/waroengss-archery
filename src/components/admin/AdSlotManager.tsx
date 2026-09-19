"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Save, X, Info, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

interface AdSlot {
  id: string;
  name: string;
  position: string;
  adClient: string;
  adSlot: string;
  adFormat: string;
  isActive: boolean;
}

const POSITIONS = [
  { value: "HOME_BOTTOM",    label: "🏠 Homepage — Bawah" },
  { value: "EVENT_BOTTOM",   label: "📅 Halaman Event — Bawah" },
  { value: "DAY_BOTTOM",     label: "📆 Halaman Hari — Bawah" },
  { value: "GALLERY_BOTTOM", label: "🖼️ Gallery Foto — Bawah" },
  { value: "PHOTO_SIDEBAR",  label: "📷 Halaman Foto — Sidebar" },
];

const inputClass =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";

const emptyForm = {
  name: "",
  position: "HOME_BOTTOM",
  adClient: "ca-pub-3940256099942544",
  adSlot: "6300978111",
  adFormat: "auto",
  isActive: true,
};

type FormState = typeof emptyForm;

function AdForm({
  title,
  form,
  onChange,
  onSave,
  onCancel,
  loading,
  saveLabel = "Simpan",
}: {
  title: string;
  form: FormState;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  saveLabel?: string;
}) {
  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...form, [key]: e.target.value });

  return (
    <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <button onClick={onCancel}><X size={18} className="text-gray-400" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Nama Slot <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="contoh: Homepage Bottom Ad"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Posisi</label>
          <select value={form.position} onChange={set("position")} className={inputClass}>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Format Iklan</label>
          <select value={form.adFormat} onChange={set("adFormat")} className={inputClass}>
            <option value="auto">Auto (Responsive)</option>
            <option value="rectangle">Rectangle</option>
            <option value="leaderboard">Leaderboard</option>
            <option value="banner">Banner</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Ad Client (ca-pub-xxxx)
          </label>
          <input
            type="text"
            value={form.adClient}
            onChange={set("adClient")}
            placeholder="ca-pub-xxxxxxxxxxxxxxxx"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Ad Slot ID</label>
          <input
            type="text"
            value={form.adSlot}
            onChange={set("adSlot")}
            placeholder="xxxxxxxxxx"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={loading || !form.name.trim()}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saveLabel}
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 px-3"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

export function AdSlotManager({ slots }: { slots: AdSlot[] }) {
  const router = useRouter();

  // add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [addLoading, setAddLoading] = useState(false);

  // edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);

  // per-row loading
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ── helpers ── */
  const startEdit = (slot: AdSlot) => {
    setEditId(slot.id);
    setEditForm({
      name: slot.name,
      position: slot.position,
      adClient: slot.adClient,
      adSlot: slot.adSlot,
      adFormat: slot.adFormat,
      isActive: slot.isActive,
    });
    setShowAdd(false);
  };

  const patch = async (id: string, data: Partial<FormState>) => {
    const res = await fetch(`/api/admin/adslots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  };

  /* ── actions ── */
  const handleAdd = async () => {
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/adslots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAdd(false);
        setAddForm(emptyForm);
        router.refresh();
      } else {
        const json = await res.json();
        alert(json.error || "Gagal menyimpan ad slot");
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editId) return;
    setEditLoading(true);
    try {
      const ok = await patch(editId, editForm);
      if (ok) {
        setEditId(null);
        router.refresh();
      } else {
        alert("Gagal menyimpan perubahan");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggle = async (slot: AdSlot) => {
    setTogglingId(slot.id);
    try {
      await patch(slot.id, { isActive: !slot.isActive });
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (slot: AdSlot) => {
    if (!confirm(`Hapus slot "${slot.name}"?`)) return;
    setDeletingId(slot.id);
    try {
      await fetch(`/api/admin/adslots/${slot.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  /* ── render ── */
  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 space-y-1">
          <p className="font-medium">Cara menggunakan Google AdSense</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-600">
            <li>Daftar di <strong>adsense.google.com</strong> dan verifikasi situs</li>
            <li>Buat unit iklan, copy <strong>ca-pub-xxxxxxx</strong> dan <strong>Slot ID</strong></li>
            <li>Tambahkan slot di bawah</li>
          </ol>
          <p className="text-xs text-blue-500 mt-1">
            Testing: Client <code>ca-pub-3940256099942544</code> · Slot <code>6300978111</code>
          </p>
        </div>
      </div>

      {/* Slot list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{slots.length} Ad Slot</h2>
          {!showAdd && (
            <button
              onClick={() => { setShowAdd(true); setEditId(null); }}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={15} /> Tambah Slot
            </button>
          )}
        </div>

        {slots.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Belum ada slot iklan.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {slots.map((slot) => (
              <div key={slot.id}>
                {/* Row */}
                {editId !== slot.id && (
                  <div className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{slot.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {POSITIONS.find((p) => p.value === slot.position)?.label}
                        {" · "}
                        <code className="bg-gray-100 px-1 rounded">{slot.adClient}</code>
                        {" · slot "}
                        <code className="bg-gray-100 px-1 rounded">{slot.adSlot}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Toggle aktif/nonaktif */}
                      <button
                        onClick={() => handleToggle(slot)}
                        disabled={togglingId === slot.id}
                        title={slot.isActive ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                      >
                        {togglingId === slot.id ? (
                          <Loader2 size={15} className="animate-spin text-gray-400" />
                        ) : slot.isActive ? (
                          <ToggleRight size={18} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={18} className="text-gray-400" />
                        )}
                        <span className={slot.isActive ? "text-green-600 font-medium" : "text-gray-400"}>
                          {slot.isActive ? "Aktif" : "Off"}
                        </span>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => startEdit(slot)}
                        title="Edit"
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(slot)}
                        disabled={deletingId === slot.id}
                        title="Hapus"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {deletingId === slot.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline edit form */}
                {editId === slot.id && (
                  <div className="px-6 py-4">
                    <AdForm
                      title={`Edit: ${slot.name}`}
                      form={editForm}
                      onChange={setEditForm}
                      onSave={handleEdit}
                      onCancel={() => setEditId(null)}
                      loading={editLoading}
                      saveLabel="Simpan Perubahan"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <AdForm
          title="Tambah Ad Slot"
          form={addForm}
          onChange={setAddForm}
          onSave={handleAdd}
          onCancel={() => { setShowAdd(false); setAddForm(emptyForm); }}
          loading={addLoading}
        />
      )}
    </div>
  );
}
