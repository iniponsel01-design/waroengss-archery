"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteEventButtonProps {
  eventId: string;
  eventTitle: string;
}

export function DeleteEventButton({ eventId, eventTitle }: DeleteEventButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = confirm(
      `Hapus event "${eventTitle}"?\n\nSemua hari, album, dan data foto akan ikut terhapus.\n\nTindakan ini TIDAK DAPAT dibatalkan.`
    );
    if (!confirmed) return;

    // Double confirm untuk event
    const reconfirmed = confirm(`Konfirmasi: Benar-benar hapus "${eventTitle}"?`);
    if (!reconfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        router.push("/admin/dashboard/events");
        router.refresh();
      } else {
        alert(json.error || "Gagal menghapus event.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      Hapus Event
    </button>
  );
}
