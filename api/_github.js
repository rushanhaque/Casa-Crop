/*  Shared GitHub plumbing for the publish endpoints.

    Named with a leading underscore so the host does not expose it as a
    route — it is a library, not an endpoint.

    Everything here speaks the Git Data API rather than the simpler
    Contents API. That choice is load-bearing: a publish now writes the
    catalogue AND any newly added photos, and the Contents API can only
    write one file per request, which would mean one commit — and one
    site rebuild — per photo, with the repository left in a half-updated
    state if any of them failed. The Git Data API assembles all of it
    into a single commit that either lands whole or does not land. */

export const OWNER = process.env.GITHUB_OWNER || 'rushanhaque'
export const REPO = process.env.GITHUB_REPO || 'Casa-Crop'
export const BRANCH = process.env.GITHUB_BRANCH || 'main'

export const CATALOGUE_PATH = 'src/data/products.json'

/*  Photos live under public/, so a deployed build serves them as plain
    static files at /product-photos/<name> with no function involved. */
export const PHOTO_DIR = 'public/product-photos'
export const PHOTO_ROUTE = '/product-photos'

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`

export function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'CasaCropSync',
    'Content-Type': 'application/json',
  }
}

export async function gh(token, path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...ghHeaders(token), ...(init.headers || {}) },
    cache: 'no-store',
  })
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = null }
  return { ok: res.ok, status: res.status, body, text }
}

/*  data:image/jpeg;base64,…  →  { bytes, ext }.

    Rejects anything that is not an image: this ends up committed to a
    public repository and served from the site's own origin, so "it
    arrived as a data URL" is not sufficient reason to write it. */
const EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

export function decodeDataUrl(dataUrl) {
  const match = /^data:([a-z]+\/[a-z0-9+.-]+);base64,(.+)$/i.exec(String(dataUrl || ''))
  if (!match) return null
  const ext = EXT[match[1].toLowerCase()]
  if (!ext) return null
  let bytes
  try { bytes = Buffer.from(match[2], 'base64') } catch { return null }
  if (!bytes.length) return null
  return { bytes, ext, mime: match[1].toLowerCase() }
}

/*  Photos are named by the hash of their own content.

    Two consequences, both wanted. The same image uploaded twice is the
    same file, so re-picking a photo does not litter the repository. And
    a given URL can never change meaning, which is what makes it safe to
    tell browsers to cache these forever — the thing that stops a
    replaced photo showing the old one on a device that saw it before. */
export async function contentName(bytes, ext) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 20)}.${ext}`
}

export function requireToken(res) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    res.status(200).json({
      ok: false,
      error: 'not-configured',
      message: 'GITHUB_TOKEN is not set on the server.',
    })
    return null
  }
  return token
}

/*  Optional shared secret, so these endpoints are not an open write
    handle on the repository. Unset means "accept any caller", which is
    the behaviour these endpoints have always had. */
export function secretOk(req) {
  const secret = process.env.ADMIN_PUBLISH_SECRET
  return !secret || req.headers['x-admin-secret'] === secret
}
