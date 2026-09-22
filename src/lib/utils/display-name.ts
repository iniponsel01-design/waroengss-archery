/**
 * generateDisplayName
 * Auto-generate alias untuk setiap foto saat sync dari Google Drive.
 * Nama asli di Drive TIDAK berubah — hanya field display_name di DB yang diisi.
 *
 * Format output: <eventSlug>-day<N>-<albumSlug>-<NNNN>
 * Contoh       : wss-archery-day1-sesi-pagi-0042
 *
 * Digunakan untuk:
 * - Pencarian yang lebih ramah pengguna (search by alias)
 * - Identifikasi foto saat pembelian (setiap foto punya ID + nama yang mudah dibaca)
 */
export function generateDisplayName(options: {
  eventSlug: string;
  dayNumber: number;
  albumSlug: string;
  /** Posisi foto dalam album — 1-based */
  position: number;
}): string {
  const { eventSlug, dayNumber, albumSlug, position } = options;

  // Sanitasi slug agar aman
  const safeEvent = slugify(eventSlug);
  const safeAlbum = slugify(albumSlug);
  const seq = String(position).padStart(4, "0");

  return `${safeEvent}-day${dayNumber}-${safeAlbum}-${seq}`;
}

/**
 * Normalisasi string ke bentuk slug lowercase
 * (sudah slug → no-op; string bebas → dijadikan slug)
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // hapus diakritik
    .replace(/[^a-z0-9]+/g, "-")     // non-alnum → dash
    .replace(/^-+|-+$/g, "")         // trim dash
    .slice(0, 40);                   // batas panjang
}
