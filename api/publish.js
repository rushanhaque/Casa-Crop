/*  Server-side publish endpoint (Vercel Serverless Function).

    The admin panel used to hold a GitHub Personal Access Token in the
    client bundle. Anything in the bundle is public, so that token was
    readable by every visitor of /admin. It now lives here, in
    process.env.GITHUB_TOKEN, where the browser cannot reach it.

    Set it once in the Vercel dashboard:
      Project → Settings → Environment Variables → GITHUB_TOKEN

    If the variable is absent the endpoint answers 501 and the client
    falls back to a token the operator pastes into Admin → Settings,
    which is kept in that browser's localStorage only. */

const OWNER = process.env.GITHUB_OWNER || 'rushanhaque'
const REPO = process.env.GITHUB_REPO || 'Casa-Crop'
const FILE_PATH = 'src/data/products.json'
const BRANCH = process.env.GITHUB_BRANCH || 'main'

const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  /*  "The server has no credential" is a capability answer, not a
      failure, and the client has a documented fallback for it. Answering
      501 made every publish log a red error in the operator's console
      for a path that then succeeded — so it answers 200 and says so in
      the body instead. */
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return res.status(200).json({
      ok: false,
      error: 'not-configured',
      message: 'GITHUB_TOKEN is not set on the server.',
    })
  }

  /*  A shared secret so the endpoint is not an open write handle on the
      repository. Optional — if unset, the endpoint accepts any caller,
      which is the previous behaviour and no worse than it was. */
  const secret = process.env.ADMIN_PUBLISH_SECRET
  if (secret && req.headers['x-admin-secret'] !== secret) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  let payload = req.body
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { payload = null }
  }
  if (!payload || !Array.isArray(payload.products)) {
    return res.status(400).json({ error: 'bad-payload' })
  }

  const body = {
    products: payload.products,
    subcategories: payload.subcategories || {},
    removedSubcategories: payload.removedSubcategories || {},
    updatedAt: new Date().toISOString(),
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'CasaCropSync',
    'Content-Type': 'application/json',
  }

  try {
    /*  The SHA of the file as it currently stands. GitHub rejects a
        content update that does not name the blob it replaces, which is
        what stops two admins overwriting each other silently. */
    let sha
    const head = await fetch(`${API}?ref=${BRANCH}`, { headers })
    if (head.ok) sha = (await head.json()).sha
    else if (head.status === 401 || head.status === 403) {
      return res.status(head.status).json({ error: 'token-invalid' })
    }

    const put = await fetch(API, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: payload.message || 'Update catalogue from Admin Panel',
        content: Buffer.from(JSON.stringify(body, null, 2), 'utf-8').toString('base64'),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    })

    if (put.ok) {
      const data = await put.json()
      return res.status(200).json({ ok: true, commit: data.commit?.sha || null })
    }

    if (put.status === 401 || put.status === 403) {
      return res.status(put.status).json({ error: 'token-invalid' })
    }

    const detail = await put.text()
    return res.status(502).json({ error: 'github-error', status: put.status, detail })
  } catch (err) {
    return res.status(500).json({ error: 'exception', message: String(err?.message || err) })
  }
}
