import { readdir, stat } from 'node:fs/promises'
import { join, parse } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const DIRS = ['public', 'public/covers', 'public/Materials']
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'

let totalBefore = 0
let totalAfter = 0

async function processDir(dir) {
  if (!existsSync(dir)) return
  console.log(`\n=== Processing ${dir} ===`)
  const entries = await readdir(dir)
  const imageFiles = entries.filter((f) => /\.(png|jpe?g)$/i.test(f))

  for (const file of imageFiles) {
    const src = join(dir, file)
    const { name, ext } = parse(file)
    const original = (await stat(src)).size
    totalBefore += original

    const isCover = dir.includes('covers')
    const isMaterial = dir.includes('Materials')
    
    // Determine max dimension
    const maxDim = isMaterial ? 800 : isCover ? 1800 : 2560

    const pipeline = sharp(src).resize({
      width: maxDim,
      height: maxDim,
      fit: 'inside',
      withoutEnlargement: true,
    })

    // WebP generation
    const webpPath = join(dir, `${name}.webp`)
    await pipeline.clone().webp({ quality: 80, effort: 6 }).toFile(webpPath)
    const webpSize = (await stat(webpPath)).size

    // AVIF generation for modern browsers
    const avifPath = join(dir, `${name}.avif`)
    await pipeline.clone().avif({ quality: 65, effort: 6 }).toFile(avifPath)
    const avifSize = (await stat(avifPath)).size

    totalAfter += webpSize

    const savings = ((1 - webpSize / original) * 100).toFixed(1)
    console.log(
      `${file.padEnd(25)} orig: ${kb(original)} -> webp: ${kb(webpSize)} (${savings}% saved)`
    )
  }
}

async function convertProductsJson() {
  const jsonPath = 'src/data/products.json'
  if (!existsSync(jsonPath)) return
  console.log(`\n=== Checking ${jsonPath} ===`)
  const raw = readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(raw)

  let modified = false
  if (Array.isArray(data.products)) {
    for (const p of data.products) {
      if (p.photo && typeof p.photo === 'string' && p.photo.startsWith('data:image/')) {
        try {
          const match = p.photo.match(/^data:image\/[a-z]+;base64,(.+)$/)
          if (match) {
            const buf = Buffer.from(match[1], 'base64')
            const originalBytes = buf.length
            const webpBuf = await sharp(buf)
              .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 80 })
              .toBuffer()
            
            p.photo = `data:image/webp;base64,${webpBuf.toString('base64')}`
            modified = true
            console.log(`Converted product ${p.name || p.sku} photo: ${kb(originalBytes)} -> ${kb(webpBuf.length)}`)
          }
        } catch (e) {
          console.error(`Failed to convert product photo for ${p.sku}:`, e)
        }
      }
    }
  }

  if (modified) {
    writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`Updated ${jsonPath} with WebP inline images.`)
  }
}

async function run() {
  for (const dir of DIRS) {
    await processDir(dir)
  }
  await convertProductsJson()
  console.log(`\n========================================`)
  console.log(`Total Before: ${kb(totalBefore)}`)
  console.log(`Total WebP:   ${kb(totalAfter)}`)
  console.log(`Total Saved:  ${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%`)
  console.log(`========================================\n`)
}

run().catch(console.error)
