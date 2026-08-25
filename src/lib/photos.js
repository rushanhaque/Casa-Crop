/*  Moving product photos out of the catalogue file.

    A photo picked in the admin panel is resized in the browser and held
    as a data URL while it is being worked on — that part is unchanged,
    and it is what lets the operator see the photo before committing to
    anything. What changed is where it ends up.

    It used to end up in products.json, base64-inlined. The catalogue
    was therefore the photo library, and inherited every one of a photo
    library's costs: it had to fit in a browser's ~5MB localStorage,
    travel whole inside a 4.5MB publish request, and be downloaded in
    full by every visitor who wanted to read a product name. Around
    thirty products all three gave way at once, and uploads simply
    stopped working with no explanation.

    Now, at publish time, each photo still carried as a data URL is
    staged into the repository as its own file and the catalogue keeps
    only the path. The catalogue goes back to being text.

    DEGRADING RATHER THAN BREAKING

    The staging endpoint needs a server credential. Where there is none
    — local development, or a host that has not been given a token — the
    photo simply stays inline exactly as it did before. That is worse,
    but it is the behaviour the panel has always had, and it means a
    missing token costs an operator nothing more than it used to. */

/*  Anything already stored as a path needs no work; only a data URL
    represents a photo that has not been filed yet. */
export function isInlinePhoto(photo) {
  return typeof photo === 'string' && photo.startsWith('data:')
}

let endpoint = 'unknown' // 'unknown' | 'available' | 'unavailable'

/*  Once staging has proved unavailable it stays that way for the life
    of the page. Re-probing per photo would cost a request and a console
    error apiece for something already known and already handled. */
async function stage(dataUrl) {
  if (endpoint === 'unavailable') return null

  let res
  try {
    res = await fetch('/api/photo-blob', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    })
  } catch {
    endpoint = 'unavailable'
    return null
  }

  /*  A host with no function runtime answers with the page shell or a
      404 rather than JSON. Either way: not available. */
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    endpoint = 'unavailable'
    return null
  }
  if (!res.headers.get('content-type')?.includes('application/json')) {
    endpoint = 'unavailable'
    return null
  }

  const data = await res.json().catch(() => ({}))

  /*  Checked before res.ok — a missing server credential is reported as
      a 200 so it does not read as an error, and the signal is in the
      body. */
  if (data.error === 'not-configured') {
    endpoint = 'unavailable'
    return null
  }

  if (res.ok && data.ok && data.repoPath && data.url && data.sha) {
    endpoint = 'available'
    return { url: data.url, repoPath: data.repoPath, sha: data.sha }
  }

  /*  A real refusal — an oversized or unreadable image — as opposed to
      the endpoint not being there. Reported, so the operator learns
      which photo the panel could not take. */
  if (res.status === 413 || res.status === 400) {
    throw new Error(data.message || 'That photo could not be uploaded.')
  }

  endpoint = 'unavailable'
  return null
}

/*  Files every inline photo in `products` and returns the products with
    paths in place of data URLs, plus the blobs the publish must commit
    alongside them.

    `onProgress(done, total)` drives the panel's progress line; a
    publish that is uploading four photos should not look like a publish
    that has hung.

    Products whose photo cannot be staged keep their data URL, so a
    partial failure degrades to the old behaviour for that one product
    rather than losing its photo. */
export async function stageInlinePhotos(products, onProgress) {
  const pending = products.filter(p => isInlinePhoto(p.photo))
  if (!pending.length) return { products, photos: [] }

  const photos = []
  /*  Keyed by the data URL, so two products sharing a photo — the same
      image picked twice — cost one upload, not two. */
  const staged = new Map()

  let done = 0
  onProgress?.(0, pending.length)

  for (const product of pending) {
    if (!staged.has(product.photo)) {
      const result = await stage(product.photo)
      staged.set(product.photo, result)
      if (result) photos.push({ repoPath: result.repoPath, sha: result.sha })
    }
    done += 1
    onProgress?.(done, pending.length)
  }

  const next = products.map(p => {
    if (!isInlinePhoto(p.photo)) return p
    const result = staged.get(p.photo)
    return result ? { ...p, photo: result.url } : p
  })

  return { products: next, photos }
}
