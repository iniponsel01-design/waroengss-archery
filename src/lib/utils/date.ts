/**
 * Date utility functions
 */

import { format, isSameYear, isSameMonth } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format a date range for display
 * e.g. "12 – 16 September 2026" or "30 Sep – 3 Oct 2026"
 */
export function formatDateRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  locale: "id" | "en" = "id"
): string {
  if (!startDate) return "";

  const dateLocale = locale === "id" ? id : undefined;

  if (!endDate || startDate.getTime() === endDate.getTime()) {
    return format(startDate, "d MMMM yyyy", { locale: dateLocale });
  }

  if (isSameMonth(startDate, endDate)) {
    return `${format(startDate, "d")} – ${format(endDate, "d MMMM yyyy", { locale: dateLocale })}`;
  }

  if (isSameYear(startDate, endDate)) {
    return `${format(startDate, "d MMM", { locale: dateLocale })} – ${format(endDate, "d MMM yyyy", { locale: dateLocale })}`;
  }

  return `${format(startDate, "d MMM yyyy", { locale: dateLocale })} – ${format(endDate, "d MMM yyyy", { locale: dateLocale })}`;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format number with locale separator
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("id-ID");
}
