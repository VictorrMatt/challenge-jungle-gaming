#!/usr/bin/env node
/**
 * Responsive image pipeline.
 *
 * Source artwork lives in `assets/images/**` (PNG/JPG/WebP exported from Figma).
 * Each file is converted into AVIF + WebP renditions at fixed widths and written to
 * `public/images/<same-path>/<name>-<width>.<format>`, which `<ResponsiveImage>` consumes.
 *
 * To replace a placeholder, drop the real export with the SAME file name into
 * `assets/images/...` and run `pnpm images` (it also runs automatically before `build`).
 * Renditions are only regenerated when the source is newer than the output.
 */
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SOURCE_DIR = path.resolve('assets/images')
const OUTPUT_DIR = path.resolve('public/images')
export const WIDTHS = [240, 480, 960]
const FORMATS = /** @type {const} */ (['avif', 'webp'])
const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const force = process.argv.includes('--force')

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (SOURCE_EXT.has(path.extname(entry.name).toLowerCase())) yield full
  }
}

async function isFresh(source, output) {
  if (force) return false
  try {
    const [src, out] = await Promise.all([stat(source), stat(output)])
    return out.mtimeMs >= src.mtimeMs
  } catch {
    return false
  }
}

let generated = 0
let skipped = 0

for await (const source of walk(SOURCE_DIR)) {
  const relative = path.relative(SOURCE_DIR, source)
  const { dir, name } = path.parse(relative)
  const targetDir = path.join(OUTPUT_DIR, dir)
  await mkdir(targetDir, { recursive: true })

  for (const width of WIDTHS) {
    for (const format of FORMATS) {
      const output = path.join(targetDir, `${name}-${width}.${format}`)
      if (await isFresh(source, output)) {
        skipped++
        continue
      }
      const pipeline = sharp(source).resize({ width, withoutEnlargement: false })
      await (
        format === 'avif'
          ? pipeline.avif({ quality: 55, effort: 6 })
          : pipeline.webp({ quality: 78, effort: 6 })
      ).toFile(output)
      generated++
    }
  }
}

console.log(`[images] ${generated} generated, ${skipped} up to date`)
