/*  Generates AVIF and WebP derivatives for everything in public/.
 *
 *  The source PNGs are photographs, and PNG is a lossless format built
 *  for flat colour and sharp edges — on a photograph it stores an
 *  enormous amount of detail nobody can see. Converting is the single
 *  largest performance win available to this site: the hero PNG is the
 *  Largest Contentful Paint element, so its weight is very nearly the
 *  LCP number on a slow connection.
 *
 *  Originals are kept and still referenced last in the image-set(), so
 *  a browser that understands neither format is served exactly what it
 *  is served today.
 *
 *  Run: npm run images
 */
import { readdir, stat } from 'node:fs/promises'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const DIR = 'public'
const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB'

const files = (await readdir(DIR)).filter((f) => /\.png$/i.test(f))
if (files.length === 0) {
  console.log('No PNGs in public/.')
  process.exit(0)
}

let before = 0
let after = 0

for (const file of files) {
  const src = join(DIR, file)
  const { name } = parse(file)
  const original = (await stat(src)).size
  before += original

  /*  Cap the longest edge at 2560px. These are full-bleed backgrounds;
      beyond roughly this size the extra pixels are invisible even on a
      high-density desktop display, and they cost decode time on the
      devices that can least afford it. */
  const base = sharp(src).resize({
    width: 2560,
    height: 2560,
    fit: 'inside',
    withoutEnlargement: true,
  })

  await base.clone().avif({ quality: 58, effort: 6 }).toFile(join(DIR, `${name}.avif`))
  await base.clone().webp({ quality: 76 }).toFile(join(DIR, `${name}.webp`))

  const avif = (await stat(join(DIR, `${name}.avif`))).size
  const webp = (await stat(join(DIR, `${name}.webp`))).size
  after += avif

  console.log(
    `${file.padEnd(20)} png ${kb(original)}   webp ${kb(webp)}   avif ${kb(avif)}   → ${(
      (1 - avif / original) *
      100
    ).toFixed(0)}% smaller`,
  )
}

console.log(
  `\nTotal, AVIF path: ${kb(before)} → ${kb(after)}  (${((1 - after / before) * 100).toFixed(0)}% saved)`,
)
