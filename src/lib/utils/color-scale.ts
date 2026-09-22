/**
 * Generate Tailwind-style 50–950 color scale dari satu hex warna utama.
 * Digunakan untuk inject CSS variables brand color di runtime.
 *
 * Teknik: konversi hex → HSL, lalu interpolate lightness per shade.
 * Tidak butuh library — pure TS.
 */

/** Parse "#rrggbb" → [r, g, b] 0..255 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

/** [r,g,b] 0..255 → [h 0..360, s 0..100, l 0..100] */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/** [h,s,l] → "#rrggbb" */
function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Lightness target per shade (Tailwind convention)
const SHADE_LIGHTNESS: Record<number, number> = {
  50:  96,
  100: 92,
  200: 84,
  300: 72,
  400: 58,
  500: 48,
  600: 38,
  700: 28,
  800: 20,
  900: 14,
  950: 9,
};

export interface BrandScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}

/**
 * Dari satu hex warna utama, hasilkan skala 50–950.
 * Hue & saturasi diambil dari warna input; lightness di-override per shade.
 */
export function generateColorScale(hex: string): BrandScale {
  // Fallback ke pink jika hex tidak valid
  const clean = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#ec4899";
  const [r, g, b] = hexToRgb(clean);
  const [h, s] = rgbToHsl(r, g, b);

  // Saturasi sedikit di-boost untuk shade terang agar tidak terlalu pucat
  const result: Partial<BrandScale> = {};
  for (const [shade, lightness] of Object.entries(SHADE_LIGHTNESS)) {
    const sat = lightness > 80 ? Math.min(s + 5, 100) : lightness < 20 ? Math.max(s - 5, 0) : s;
    result[Number(shade) as keyof BrandScale] = hslToHex(h, sat, lightness);
  }
  return result as BrandScale;
}

/** Hasilkan string `<style>` CSS variables untuk diinject ke `<head>` */
export function buildBrandCssVars(hex: string): string {
  const scale = generateColorScale(hex);
  const vars = Object.entries(scale)
    .map(([shade, color]) => `  --brand-${shade}: ${color};`)
    .join("\n");
  return `:root {\n${vars}\n}`;
}
