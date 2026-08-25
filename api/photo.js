/*  A product photo, served straight from the repository.

    This exists to cover exactly one window. Photos are committed to
    public/product-photos/ and are served by the host as ordinary static
    files once a build has run — fast, free, no function involved. But a
    publish reaches the catalogue endpoint within seconds and a build
    takes minutes, so for that gap the site is describing products whose
    images are not deployed yet. Without this, a freshly published
    product appears on every device with a broken image.

    It is wired as a REWRITE, not a redirect, and rewrites are only
    consulted when nothing matches on disk. So this runs solely during
    that gap: the moment the build lands, the static file wins and this
    function stops being reached at all. There is nothing to switch off
    afterwards and no second URL for the same image.

    Photo filenames are the hash of their own contents, so a given URL
    can never mean a different image. That is what makes it safe to tell
    browsers to keep these forever — and it is why replacing a product's
    photo can never leave a device showing the previous one. */

import { OWNER, REPO, BRANCH, PHOTO_DIR } from './_github.js'

const NAME = /^[a-f0-9]{20}\.(jpg|png|webp|avif|gif)$/

const MIME = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  /*  Whatever the rewrite captured. Validated against the shape this
      endpoint issues rather than sanitised, because anything else is
      an attempt to read a file that is not a product photo. */
  const name = String(req.query?.name || '')
  if (!NAME.test(name)) {
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    return res.status(400).json({ error: 'bad-name' })
  }

  const ext = name.split('.').pop()
  const raw = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PHOTO_DIR}/${name}`

  try {
    const upstream = await fetch(raw, {
      headers: { 'User-Agent': 'CasaCropPhoto' },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      /*  Not committed yet, or never existed. Deliberately not cached:
          this is a transient state during a publish, and a cached 404
          would outlive it and keep the image broken after it arrived. */
      res.setHeader('Cache-Control', 'no-store, max-age=0')
      return res.status(404).json({ error: 'not-found' })
    }

    const body = Buffer.from(await upstream.arrayBuffer())

    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
    res.setHeader('Content-Length', String(body.length))
    /*  Content-addressed, so immutable is literally true. */
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.status(200).send(body)
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    return res.status(502).json({ error: 'upstream-unavailable', message: String(err?.message || err) })
  }
}
