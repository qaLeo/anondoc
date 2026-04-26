/**
 * Generate PWA icons from the AnonDoc inline SVG logo.
 * Run: node scripts/generate-pwa-icons.mjs  (from apps/web/)
 *
 * Output:
 *   public/icon-192.png           192×192  standard
 *   public/icon-512.png           512×512  standard
 *   public/icon-maskable-512.png  512×512  maskable (safe zone ~80%)
 *   public/apple-touch-icon.png   180×180  iOS home screen
 */

import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dir, '..', 'public')
await mkdir(publicDir, { recursive: true })

// AnonDoc logo: blue rounded square + 3 white document lines
// Extracted from AppIcon component in src/App.tsx (viewBox 0 0 28 28)
const BRAND_BLUE = '#1a56db'
const BG_WARM_WHITE = '#FAFAF8'

function logoSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="28" height="28" rx="7" fill="${BRAND_BLUE}"/>
  <path d="M8 10h12M8 14h8M8 18h10" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
</svg>`
}

// Maskable: logo centred in safe zone (~80% of canvas), rest is warm-white background
function maskableSvg(canvasSize) {
  const iconSize = Math.round(canvasSize * 0.8)        // 410 for 512
  const offset = Math.round((canvasSize - iconSize) / 2) // 51 for 512
  // rx scales proportionally from 7/28 of icon size
  const rx = Math.round((7 / 28) * iconSize)
  // path coordinates: scale factor
  const s = iconSize / 28
  const p = (n) => (n * s + offset).toFixed(1)

  return `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${canvasSize}" height="${canvasSize}" fill="${BG_WARM_WHITE}"/>
  <rect x="${offset}" y="${offset}" width="${iconSize}" height="${iconSize}" rx="${rx}" fill="${BRAND_BLUE}"/>
  <path d="M${p(8)} ${p(10)}h${(12 * s).toFixed(1)}M${p(8)} ${p(14)}h${(8 * s).toFixed(1)}M${p(8)} ${p(18)}h${(10 * s).toFixed(1)}" stroke="#ffffff" stroke-width="${(2 * s).toFixed(1)}" stroke-linecap="round"/>
</svg>`
}

const icons = [
  { file: 'icon-192.png',          size: 192,  svg: () => logoSvg(192) },
  { file: 'icon-512.png',          size: 512,  svg: () => logoSvg(512) },
  { file: 'icon-maskable-512.png', size: 512,  svg: () => maskableSvg(512) },
  { file: 'apple-touch-icon.png',  size: 180,  svg: () => logoSvg(180) },
]

for (const { file, size, svg } of icons) {
  const outPath = join(publicDir, file)
  await sharp(Buffer.from(svg()))
    .resize(size, size)
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outPath)
  console.log(`✓  ${file}`)
}

console.log('\nDone — icons written to public/')
