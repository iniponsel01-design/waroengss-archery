/**
 * Generate PWA icons
 * Run: node scripts/generate-icons.mjs
 *
 * Generates:
 * - public/icons/icon-192.png
 * - public/icons/icon-512.png
 * - public/favicon.ico (via SVG)
 * - public/apple-touch-icon.png (180x180)
 */

import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

mkdirSync(iconsDir, { recursive: true });

// SVG icon source — archery/bow design dengan warna brand
const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <!-- Background circle -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <!-- W letter for Waroeng -->
  <text
    x="50%"
    y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${size * 0.52}"
    fill="#ec4899"
    letter-spacing="-2"
  >W</text>
  <!-- SS small text -->
  <text
    x="50%"
    y="82%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-weight="700"
    font-size="${size * 0.14}"
    fill="#94a3b8"
    letter-spacing="3"
  >ARCHERY</text>
</svg>`;

// Write SVG icon
writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon(512));
console.log('✅ SVG icon created');

// Try to use sharp for PNG conversion
let sharpLoaded = false;
try {
  const { default: sharp } = await import('sharp');
  sharpLoaded = true;

  const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 180, name: 'apple-touch-icon.png', dir: publicDir },
    { size: 32,  name: 'favicon-32.png' },
    { size: 16,  name: 'favicon-16.png' },
  ];

  for (const { size, name, dir = iconsDir } of sizes) {
    await sharp(Buffer.from(svgIcon(size)))
      .resize(size, size)
      .png()
      .toFile(path.join(dir, name));
    console.log(`✅ Generated: ${name} (${size}x${size})`);
  }

  // Copy apple-touch-icon to public root
  console.log('✅ apple-touch-icon.png created');

} catch (err) {
  console.log('⚠️  sharp not available, writing SVG fallback as PNG placeholder...');
  // Write SVG as-is to icon paths (browser will accept SVG as icon in many cases)
  writeFileSync(path.join(iconsDir, 'icon-192.png'), svgIcon(192));
  writeFileSync(path.join(iconsDir, 'icon-512.png'), svgIcon(512));
  writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), svgIcon(180));
  console.log('✅ Fallback SVG icons written (replace with real PNG for production)');
}

console.log('\n✅ Icon generation complete!');
console.log('📌 Icons saved to public/icons/');
