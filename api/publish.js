/*  Server-side publish endpoint (Vercel Serverless Function).

    The admin panel used to hold a GitHub Personal Access Token in the
    client bundle. Anything in the bundle is public, so that token was
    readable by every visitor of /admin. It now lives here, in
    process.env.GITHUB_TOKEN, where the browser cannot reach it.

    Set it once in the Vercel dashboard:
      Project → Settings → Environment Variables → GITHUB_TOKEN

    If the variable is absent the endpoint answers 200 with
    error:'not-configured' and the client falls back to a token the
    operator pastes into Admin → Settings, which is kept in that
    browser's localStorage only.

    ONE COMMIT PER PUBLISH

    A publish can now carry new photos as well as the catalogue. Those
    are staged as loose git blobs by /api/photo-blob and referenced here
    by SHA, so the whole publish is assembled into a single commit
    through the Git Data API. Writing them one at a time through the
    simpler Contents API would mean a commit — and a site rebuild — per
    photo, and would leave the repository describing products whose
    images had not arrived yet if any request in the middle failed. */

import {
  BRANCH, CATALOGUE_PATH, gh, requireToken, secretOk,
} from './_github.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  /*  "The server has no credential" is a capability answer, not a
      failure, and the client has a documented fallback for it. Answering
      501 made every publish log a red error in the operator's console
      for a path that then succeeded — so it answers 200 and says so in
      the body instead. */
  const token = requireToken(res)
  if (!token) return undefined
  if (!secretOk(req)) return res.status(401).json({ error: 'unauthorized' })

  let payload = req.body
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { payload = null }
  }
  if (!payload || !Array.isArray(payload.products)) {
    return res.status(400).json({ error: 'bad-payload' })
  }

  /*  The catalogue is text now that photos are files, so this is a
      guard against a pathological payload rather than a ceiling the
      panel is expected to approach. It used to be reached at about
      thirty products. */
  const approxBytes = JSON.stringify(payload.products).length
  if (approxBytes > 4_000_000) {
    return res.status(413).json({
      error: 'too-large',
      bytes: approxBytes,
      message:
        'The catalogue is too large to publish in one request. '
        + 'Some product photos are still stored inside it — re-save those products to move them out.',
    })
  }

  /*  Stamped on the server, not in the browser.

      Every device decides whether an incoming snapshot is newer than
      the one it holds by comparing this field, so it has to come from
      one clock. A browser with a skewed clock — a phone that has been
      off for a week, a laptop restored from sleep — would otherwise
      publish a catalogue stamped in the past, and every other device
      would correctly conclude it was stale and refuse it. */
  const updatedAt = new Date().toISOString()

  const catalogue = {
    products: payload.products,
    subcategories: payload.subcategories || {},
    removedSubcategories: payload.removedSubcategories || {},
    updatedAt,
  }

  /*  Photos staged by /api/photo-blob. Filtered rather than trusted:
      each of these becomes a path in a commit, so a caller must not be
      able to name an arbitrary file in the repository. */
  const PHOTO_PATH = /^public\/product-photos\/[a-f0-9]{20}\.(jpg|png|webp|avif|gif)$/
  const BLOB_SHA = /^[a-f0-9]{40}$/
  const photos = (Array.isArray(payload.photos) ? payload.photos : []).filter(
    p => typeof p?.repoPath === 'string'
      && typeof p?.sha === 'string'
      && PHOTO_PATH.test(p.repoPath)
      && BLOB_SHA.test(p.sha),
  )

  try {
    /*  The commit this publish builds on. Naming it as the parent is
        what stops two admins silently overwriting each other: if the
        branch has moved on since, the ref update below is rejected
        rather than applied. */
    const ref = await gh(token, `/git/ref/heads/${BRANCH}`)
    if (ref.status === 401 || ref.status === 403) {
      return res.status(ref.status).json({ error: 'token-invalid' })
    }
    if (!ref.ok || !ref.body?.object?.sha) {
      return res.status(502).json({ error: 'github-error', status: ref.status, detail: ref.text?.slice(0, 400) })
    }
    const parentSha = ref.body.object.sha

    const parent = await gh(token, `/git/commits/${parentSha}`)
    if (!parent.ok || !parent.body?.tree?.sha) {
      return res.status(502).json({ error: 'github-error', status: parent.status, detail: parent.text?.slice(0, 400) })
    }

    /*  One tree entry per file this publish touches, laid over the
        parent's tree so everything else in the repository is carried
        forward untouched. The catalogue goes in as inline content — it
        is text and small now — while photos reference blobs already
        uploaded. */
    const tree = [
      {
        path: CATALOGUE_PATH,
        mode: '100644',
        type: 'blob',
        content: JSON.stringify(catalogue, null, 2),
      },
      ...photos.map(p => ({
        path: p.repoPath,
        mode: '100644',
        type: 'blob',
        sha: p.sha,
      })),
    ]

    const built = await gh(token, '/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: parent.body.tree.sha, tree }),
    })
    if (!built.ok || !built.body?.sha) {
      return res.status(502).json({ error: 'github-error', status: built.status, detail: built.text?.slice(0, 400) })
    }

    const photoNote = photos.length
      ? ` (+${photos.length} photo${photos.length === 1 ? '' : 's'})`
      : ''

    const commit = await gh(token, '/git/commits', {
      method: 'POST',
      body: JSON.stringify({
        message: (payload.message || 'Update catalogue from Admin Panel') + photoNote,
        tree: built.body.sha,
        parents: [parentSha],
      }),
    })
    if (!commit.ok || !commit.body?.sha) {
      return res.status(502).json({ error: 'github-error', status: commit.status, detail: commit.text?.slice(0, 400) })
    }

    /*  Fast-forward only. A rejection here means the branch moved while
        this publish was being assembled, which is exactly the case the
        operator must be told about rather than have resolved silently. */
    const update = await gh(token, `/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.body.sha, force: false }),
    })
    if (update.status === 422) {
      return res.status(409).json({
        error: 'conflict',
        message: 'The catalogue changed on GitHub while this was publishing. Reload the panel, then publish again.',
      })
    }
    if (!update.ok) {
      return res.status(502).json({ error: 'github-error', status: update.status, detail: update.text?.slice(0, 400) })
    }

    /*  updatedAt goes back to the caller so the admin panel can poll
        /api/catalogue until the stamp it sees matches the one that was
        just written, and only then report the publish as landed. */
    return res.status(200).json({
      ok: true,
      commit: commit.body.sha,
      photos: photos.length,
      updatedAt,
    })
  } catch (err) {
    return res.status(500).json({ error: 'exception', message: String(err?.message || err) })
  }
}
