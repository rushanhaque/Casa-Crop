/*  The live catalogue, read at request time.

    WHY THIS EXISTS

    Publishing used to mean: commit src/data/products.json to GitHub,
    wait for the host to rebuild, and hope every device eventually
    picked up the new build. That chain had three places to get stuck,
    and all three were hit in practice:

      1. The rebuild. Between the commit and the deploy going live —
         a minute or two on a good day, forever if the build is failing
         or auto-deploy is off — every visitor is served the PREVIOUS
         catalogue while the admin panel says "Published".
      2. The bundle. The JSON was compiled into a content-hashed asset
         cached for a year. A browser holding the old hash never asked
         for the new one.
      3. The static /products.json. Better, but still only as fresh as
         the last successful deploy.

    This endpoint removes the rebuild from the path entirely. It reads
    the catalogue straight out of the repository on each request, so a
    publish is visible everywhere within seconds regardless of whether
    the host has finished — or even started — a build.

    Cached at the edge for a few seconds so a burst of visitors does not
    become a burst of GitHub calls; `?fresh=<anything>` gives a distinct
    cache key and therefore a guaranteed-uncached read, which is what
    the admin panel uses to confirm its own publish landed.  */

const OWNER = process.env.GITHUB_OWNER || 'rushanhaque'
const REPO = process.env.GITHUB_REPO || 'Casa-Crop'
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const FILE_PATH = 'src/data/products.json'

/*  Accept: raw sidesteps the Contents API's 1MB base64 ceiling, which a
    catalogue carrying inline photos crosses almost immediately. */
const CONTENTS = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${FILE_PATH}`

async function fromContentsApi(token) {
  const res = await fetch(CONTENTS, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw',
      'User-Agent': 'CasaCropCatalogue',
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.text()
}

/*  No token, or the token was rejected. raw.githubusercontent is public
    and unmetered; its own CDN holds a copy for a few minutes, so this
    path is slower to reflect a publish than the API one — but it is a
    fallback, not the design. */
async function fromRaw() {
  const res = await fetch(`${RAW}?ts=${Date.now()}`, {
    headers: { 'User-Agent': 'CasaCropCatalogue' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.text()
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  /*  A caller that asked for a guaranteed-fresh read gets one; the URL
      it used is unique, so no shared cache can answer it, and telling
      every downstream cache not to keep it stops that unique URL from
      accumulating in one. */
  const forced = 'fresh' in (req.query || {})
  res.setHeader(
    'Cache-Control',
    forced
      ? 'no-store, max-age=0'
      : 'public, max-age=0, s-maxage=10, stale-while-revalidate=30',
  )
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  let text = null
  const token = process.env.GITHUB_TOKEN
  try {
    if (token) text = await fromContentsApi(token)
    if (text === null) text = await fromRaw()
  } catch {
    text = null
  }

  /*  GitHub unreachable. Answering 503 rather than an empty catalogue
      matters: the client treats a failed fetch as "keep what you have"
      and falls back to the static /products.json, whereas a 200 with
      zero products would wipe the visible range pages. */
  if (text === null) {
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    return res.status(503).json({ error: 'upstream-unavailable' })
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    return res.status(502).json({ error: 'bad-upstream-json' })
  }
  if (!Array.isArray(parsed?.products)) {
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    return res.status(502).json({ error: 'bad-upstream-shape' })
  }

  /*  A weak validator keyed on the publish stamp, so a browser that
      re-checks on every tab focus mostly gets a 304 and no body. */
  const etag = `W/"cat-${parsed.updatedAt || 'none'}-${parsed.products.length}"`
  res.setHeader('ETag', etag)
  if (req.headers['if-none-match'] === etag) return res.status(304).end()

  return res.status(200).send(text)
}
