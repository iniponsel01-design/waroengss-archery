"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface NewPhotoBadgeProps {
  /** Key unik per halaman, misal "album-cuid123" */
  storageKey: string;
  /** Total foto saat ini */
  currentCount: number;
  /** Waktu foto terakhir ditambah (ISO string) */
  lastSyncAt?: string | null;
}

const STORAGE_PREFIX = "wss_photocount_";

/**
 * Badge "Foto Baru!" — muncul jika jumlah foto bertambah sejak kunjungan terakhir.
 * Tidak memerlukan server-side logic — murni localStorage comparison.
 */
export function NewPhotoBadge({ storageKey, currentCount, lastSyncAt }: NewPhotoBadgeProps) {
  const [isNew, setIsNew] = useState(false);
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${storageKey}`;
    const stored = localStorage.getItem(key);
    const storedCount = stored ? parseInt(stored, 10) : null;

    if (storedCount !== null && currentCount > storedCount) {
      setDiff(currentCount - storedCount);
      setIsNew(true);
    }

    // Update stored count — user sudah "melihat" jumlah ini
    localStorage.setItem(key, String(currentCount));
  }, [storageKey, currentCount]);

  if (!isNew) return null;

  return (
    <span className="inline-flex items-center gap-1 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
      <Sparkles size={9} />
      +{diff} baru
    </span>
  );
}
