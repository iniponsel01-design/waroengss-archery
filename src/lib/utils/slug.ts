/**
 * Slug generation utilities
 */

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .trim()
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim hyphens from ends
}

export function generateEventSlug(title: string, year?: number): string {
  const base = generateSlug(title);
  if (year) return `${base}-${year}`;
  return base;
}
