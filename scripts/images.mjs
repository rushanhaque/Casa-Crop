/*  Generates AVIF and WebP derivatives for everything in public/, public/covers/, and public/Materials/.
 *
 *  Run: npm run images
 */
import { readdir, stat } from 'node:fs/promises'
import { join, parse } from 'node:path'
import { existsSync } from 'node:fs'
import sharp from 'sharp'

const DIRS = ['public', 'public/covers', 'public/Materials']
const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB'

let before = 0
let afterWebp = 0
let afterAvif = 0

for (const dir of DIRS) {
  if (!existsSync(dir)) continue
  const files = (await readdir(dir)).filter((f) => /\.(png|jpe?g)$/i.test(f))
  if (files.length === 0) continue

  console.log(`\n=== Converting in ${dir} ===`)
  for (const file of files) {
    const src = join(dir, file)
    const { name } = parse(file)
    const original = (await stat(src)).size
    before += original

    const isCover = dir.includes('covers')
    const isMaterial = dir.includes('Materials')
    const maxDim = isMaterial ? 800 : isCover ? 1800 : 2560

    const base = sharp(src).resize({
      width: maxDim,
      height: maxDim,
      fit: 'inside',
      withoutEnlargement: true,
    })

    const avifDest = join(dir, `${name}.avif`)
    const webpDest = join(dir, `${name}.webp`)

    await base.clone().avif({ quality: 65, effort: 6 }).toFile(avifDest)
    await base.clone().webp({ quality: 80, effort: 6 }).toFile(webpDest)

    const avif = (await stat(avifDest)).size
    const webp = (await stat(webpDest)).size
    afterAvif += avif
    afterWebp += webp

    console.log(
      `${file.padEnd(25)} orig ${kb(original)}   webp ${kb(webp)}   avif ${kb(avif)}   → ${(
        (1 - webp / original) *
        100
      ).toFixed(0)}% smaller`,
    )
  }
}

console.log(
  `\nTotal: ${kb(before)} → WebP: ${kb(afterWebp)} (${((1 - afterWebp / before) * 100).toFixed(0)}% saved) | AVIF: ${kb(afterAvif)} (${((1 - afterAvif / before) * 100).toFixed(0)}% saved)`,
)
