"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

interface SiteSettingsFormProps {
  settings: Record<string, string>;
}

const SETTING_KEYS = [
  { key: "brand_name", label: "Nama Brand", placeholder: "Waroeng SS Archery" },
  { key: "brand_tagline", label: "Tagline", placeholder: "Event Documentation Gallery" },
  { key: "brand_website", label: "Website", placeholder: "https://waroengss.com" },
  { key: "primary_color", label: "Warna Utama (hex)", placeholder: "#ec4899" },
  { key: "footer_text", label: "Footer Text", placeholder: "© 2026 Waroeng SS Archery" },
];

export function SiteSettingsForm({ settings }: SiteSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({ ...settings });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all(
        SETTING_KEYS.map(({ key }) =>
          fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value: form[key] ?? "" }),
          })
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      {SETTING_KEYS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
          <input
            type="text"
            value={form[key] ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            className={inputClass}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saved ? "Tersimpan!" : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
