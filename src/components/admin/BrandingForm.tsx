"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle, Globe, Instagram, Facebook, Youtube, Music2 } from "lucide-react";

interface BrandingFormProps {
  settings: Record<string, string>;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";

export function BrandingForm({ settings }: BrandingFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    brand_name:       settings.brand_name       ?? "Waroeng SS Archery",
    brand_tagline:    settings.brand_tagline     ?? "Event Documentation Gallery",
    brand_website:    settings.brand_website     ?? "",
    brand_logo_url:   settings.brand_logo_url    ?? "",
    primary_color:    settings.primary_color     ?? "#ec4899",
    footer_text:      settings.footer_text       ?? "",
    social_instagram: settings.social_instagram  ?? "",
    social_facebook:  settings.social_facebook   ?? "",
    social_youtube:   settings.social_youtube    ?? "",
    social_tiktok:    settings.social_tiktok     ?? "",
    hero_title:       settings.hero_title        ?? "",
    hero_subtitle:    settings.hero_subtitle     ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const entries = Object.entries(form);
      const results = await Promise.all(
        entries.map(([key, value]) =>
          fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
          })
        )
      );

      const allOk = results.every((r) => r.ok);
      if (!allOk) {
        setError("Sebagian data gagal disimpan. Coba lagi.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Identitas ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Identitas Platform</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Nama Brand <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.brand_name}
            onChange={set("brand_name")}
            placeholder="Waroeng SS Archery"
            required
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            Tampil di header, footer, dan PWA
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Tagline</label>
          <input
            type="text"
            value={form.brand_tagline}
            onChange={set("brand_tagline")}
            placeholder="Event Documentation Gallery"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Website URL</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={form.brand_website}
              onChange={set("brand_website")}
              placeholder="https://waroengss.com"
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">URL Logo</label>
          <input
            type="url"
            value={form.brand_logo_url}
            onChange={set("brand_logo_url")}
            placeholder="https://... (link gambar logo)"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            PNG/SVG transparan, ukuran ideal 200×60px. Host di Google Drive (shared), Imgur, atau CDN.
          </p>
          {form.brand_logo_url && (
            <div className="mt-2 p-3 bg-gray-900 rounded-xl inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.brand_logo_url}
                alt="Logo preview"
                className="h-10 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Warna ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Warna Brand</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Warna Utama</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primary_color}
              onChange={set("primary_color")}
              className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-0.5"
            />
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={form.primary_color}
                onChange={set("primary_color")}
                placeholder="#ec4899"
                className={inputClass}
                pattern="^#[0-9a-fA-F]{6}$"
              />
              <p className="text-xs text-gray-400">Format: #RRGGBB</p>
            </div>
          </div>

          {/* Color presets */}
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Preset warna:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { color: "#ec4899", name: "Pink (Default)" },
                { color: "#3b82f6", name: "Biru" },
                { color: "#10b981", name: "Hijau" },
                { color: "#f59e0b", name: "Amber" },
                { color: "#8b5cf6", name: "Ungu" },
                { color: "#ef4444", name: "Merah" },
                { color: "#06b6d4", name: "Cyan" },
                { color: "#84cc16", name: "Lime" },
              ].map(({ color, name }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, primary_color: color }))}
                  className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: form.primary_color === color ? "white" : "transparent",
                    outline: form.primary_color === color ? `2px solid ${color}` : "none",
                    outlineOffset: "2px",
                  }}
                  title={name}
                  aria-label={name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Hero Section Homepage
          <span className="ml-2 text-xs text-gray-400 normal-case font-normal">(kosongkan = gunakan default)</span>
        </h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Judul Hero</label>
          <input
            type="text"
            value={form.hero_title}
            onChange={set("hero_title")}
            placeholder="Event Documentation Gallery"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Subjudul Hero</label>
          <input
            type="text"
            value={form.hero_subtitle}
            onChange={set("hero_subtitle")}
            placeholder="Temukan, lihat, dan unduh foto dokumentasi event..."
            className={inputClass}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Footer</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Teks Footer</label>
          <input
            type="text"
            value={form.footer_text}
            onChange={set("footer_text")}
            placeholder="© 2026 Waroeng SS Archery. All rights reserved."
            className={inputClass}
          />
        </div>
      </div>

      {/* ── Social Media ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Social Media</h2>
        <p className="text-xs text-gray-400 -mt-2">
          Isi URL lengkap profil sosial media (opsional). Akan tampil di footer.
        </p>

        {[
          { key: "social_instagram" as const, label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/waroengss" },
          { key: "social_facebook"  as const, label: "Facebook",  icon: Facebook,  placeholder: "https://facebook.com/waroengss" },
          { key: "social_youtube"   as const, label: "YouTube",   icon: Youtube,   placeholder: "https://youtube.com/@waroengss" },
          { key: "social_tiktok"    as const, label: "TikTok",    icon: Music2,    placeholder: "https://tiktok.com/@waroengss" },
        ].map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
            <div className="relative">
              <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 pb-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
          ) : saved ? (
            <><CheckCircle size={15} className="text-green-300" /> Tersimpan!</>
          ) : (
            <><Save size={15} /> Simpan Branding</>
          )}
        </button>

        {saved && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Semua perubahan berhasil disimpan
          </span>
        )}
      </div>
    </form>
  );
}
