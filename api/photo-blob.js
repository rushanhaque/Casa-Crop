/*  Stage one product photo for the next publish.

    A photo arrives here as a data URL, is written into the repository's
    object store as a git blob, and its SHA comes back. Nothing is
    committed — the blob is loose until /api/publish builds a tree that
    references it, which is what lets a publish carry several new photos
    and the catalogue in a single commit.

    WHY PHOTOS ARE NOT IN THE CATALOGUE ANY MORE

    They used to be base64-inlined into products.json, which made that
    one file the photo library. Three ceilings followed from that, and
    all three were hit: the browser's ~5MB localStorage quota, where the
    working copy lived; the 4.5MB request cap on a publish, which sends
    the whole catalogue at once; and the sheer weight of a file that
    every visitor downloads in full to read a handful of product names.
    Roughly thirty products and the panel simply stopped working.

    Photos as files remove all three. The catalogue goes back to being
    text, and the images are served as static assets. */

import { decodeDataUrl, contentName, gh, requireToken, secretOk, PHOTO_DIR, PHOTO_ROUTE } from './_github.js'

/*  A single photo, already resized and re-encoded by the browser before
    it gets here. The ceiling is defence against a caller that skipped
    that step, not a limit the panel is expected to approach. */
const MAX_PHOTO_BYTES = 3_000_000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  const token = requireToken(res)
  if (!token) return undefined
  if (!secretOk(req)) return res.status(401).json({ error: 'unauthorized' })

  let payload = req.body
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { payload = null }
  }

  const decoded = decodeDataUrl(payload?.dataUrl)
  if (!decoded) return res.status(400).json({ error: 'bad-image' })
  if (decoded.bytes.length > MAX_PHOTO_BYTES) {
    return res.status(413).json({
      error: 'too-large',
      message: 'That photo is too large. Choose a smaller one.',
    })
  }

  const name = await contentName(decoded.bytes, decoded.ext)

  const blob = await gh(token, '/git/blobs', {
    method: 'POST',
    body: JSON.stringify({
      content: decoded.bytes.toString('base64'),
      encoding: 'base64',
    }),
  })

  if (blob.status === 401 || blob.status === 403) {
    return res.status(blob.status).json({ error: 'token-invalid' })
  }
  if (!blob.ok || !blob.body?.sha) {
    return res.status(502).json({ error: 'github-error', status: blob.status, detail: blob.text?.slice(0, 400) })
  }

  return res.status(200).json({
    ok: true,
    sha: blob.body.sha,
    /*  Where it will live in the repository, and where the site will
        serve it from. The catalogue stores the second one. */
    repoPath: `${PHOTO_DIR}/${name}`,
    url: `${PHOTO_ROUTE}/${name}`,
    bytes: decoded.bytes.length,
  })
}
