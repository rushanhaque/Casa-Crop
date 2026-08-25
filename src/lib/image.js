/*  Photos are stored inline in products.json as data URLs, because the
    catalogue has no asset host — the JSON file IS the CMS.

    That makes the size of each photo a repository concern rather than a
    page-weight concern alone: a 4MB phone photo becomes ~5.4MB of base64
    in a file that is committed on every edit, and GitHub's Contents API
    refuses payloads much past that. So every upload is decoded, scaled
    to fit a bounding box, and re-encoded before it is ever stored.

    JPEG rather than WebP for the encode: WebP is smaller, but Safari's
    canvas.toBlob has shipped it only since 14 and a silent fallback to
    PNG there would be far larger than the JPEG. */

/*  1200px is the widest the product page ever paints a photo, so
    anything above it is bytes the visitor downloads and never sees.

    The per-photo ceiling matters more than it looks: the whole
    catalogue travels as ONE JSON body on every publish, and the
    serverless route that carries it is capped at 4.5MB. At 350KB a
    photo that is roughly a dozen products before the cap is in sight,
    which is why the panel reports the running total. */
const MAX_EDGE = 1200
const QUALITY = 0.8
export const MAX_STORED_BYTES = 350_000

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')) }
    img.src = url
  })
}

function encode(canvas, quality) {
  try {
    const webp = canvas.toDataURL('image/webp', quality)
    if (webp && webp.startsWith('data:image/webp')) {
      return webp
    }
  } catch {}
  return canvas.toDataURL('image/jpeg', quality)
}

/*  Returns { dataUrl, width, height, bytes }. */
export async function compressImage(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('That file is not an image.')
  }

  const img = await loadImage(file)

  const draw = (edge) => {
    const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    /*  A white ground under the draw: transparent PNGs would otherwise
        encode their alpha as black once flattened into JPEG. */
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return { canvas, w, h }
  }

  const bytesOf = (url) => Math.round(url.length * 0.75)

  let edge = maxEdge
  let { canvas, w, h } = draw(edge)
  let q = quality
  let dataUrl = encode(canvas, q)

  /*  Quality first, dimensions second. Detail at full size survives a
      lower quality better than detail at half size survives a high one,
      so the encoder gives up sharpness before it gives up pixels — and
      only drops to a smaller canvas once quality has bottomed out. */
  while (bytesOf(dataUrl) > MAX_STORED_BYTES) {
    if (q > 0.45) {
      q -= 0.1
    } else if (edge > 600) {
      edge = Math.round(edge * 0.75)
      ;({ canvas, w, h } = draw(edge))
      q = quality
    } else {
      break
    }
    dataUrl = encode(canvas, q)
  }

  return { dataUrl, width: w, height: h, bytes: bytesOf(dataUrl) }
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
