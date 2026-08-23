/*  Publishing the catalogue to GitHub.

    Two routes, tried in order:

    1. POST /api/publish — a serverless function that holds the token in
       an environment variable the browser never sees. This is the route
       that should be used in production.
    2. Direct GitHub Contents API with a token the operator pastes into
       Admin → Settings, kept in this browser's localStorage. This is the
       fallback for local development and for the window before
       GITHUB_TOKEN is set on the host.

    There is deliberately NO token compiled into this file. The previous
    version carried a base64-obfuscated Personal Access Token, which put
    a write handle on the repository into every page load of /admin. */

const OWNER = 'rushanhaque'
const REPO = 'Casa-Crop'
const FILE_PATH = 'src/data/products.json'
const BRANCH = 'main'
const TOKEN_KEY = 'casa-and-crop:github-token'

/*  Edits arrive in bursts — a save, then another save, then a delete.
    One commit per keystroke-sized change buries the repository history,
    so writes coalesce into a single commit once the operator pauses. */
const DEBOUNCE_MS = 1800

/*  status:
      'idle'          nothing published yet this session
      'pending'       edits queued, waiting out the debounce
      'syncing'       request in flight
      'synced'        the remote file matches local state
      'token-needed'  no server token and no local token
      'token-invalid' the token we have was rejected
      'offline'       the network refused the request
      'error'         anything else, with `detail` for the operator      */
let state = { status: 'idle', time: null, detail: null }
let listeners = []
let timer = null
let queued = null
let inFlight = false

export function subscribeSyncStatus(listener) {
  listeners.push(listener)
  listener(state)
  return () => { listeners = listeners.filter(l => l !== listener) }
}

function emit(status, patch = {}) {
  state = { ...state, status, detail: null, ...patch }
  listeners.forEach(l => l(state))
}

function stamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export function setStoredToken(token) {
  try {
    const clean = (token || '').trim()
    if (clean) localStorage.setItem(TOKEN_KEY, clean)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* private mode — the server route still works */ }
}

function buildPayload(products, subcategories, removedSubcategories, message) {
  return {
    products: products || [],
    subcategories: subcategories || {},
    removedSubcategories: removedSubcategories || {},
    message,
  }
}

/*  Route 1 — the server holds the credential. */
async function publishViaServer(payload) {
  let res
  try {
    res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return { outcome: 'unavailable' }
  }

  /*  A static host with no function runtime answers the POST with the
      SPA shell or a 404/405 rather than JSON. Either way: not available. */
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    return { outcome: 'unavailable' }
  }
  if (!res.headers.get('content-type')?.includes('application/json')) {
    return { outcome: 'unavailable' }
  }

  const data = await res.json().catch(() => ({}))
  if (res.ok) return { outcome: 'ok' }
  if (data.error === 'not-configured') return { outcome: 'unavailable' }
  if (res.status === 401 || res.status === 403) return { outcome: 'token-invalid' }
  return { outcome: 'error', detail: data.message || data.detail || `Server responded ${res.status}` }
}

/*  Route 2 — this browser holds the credential. */
async function publishViaBrowser(payload) {
  const token = getStoredToken()
  if (!token) return { outcome: 'token-needed' }

  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }

  const file = {
    products: payload.products,
    subcategories: payload.subcategories,
    removedSubcategories: payload.removedSubcategories,
    updatedAt: new Date().toISOString(),
  }
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(file, null, 2))))

  try {
    let sha
    const head = await fetch(`${api}?ref=${BRANCH}`, { headers })
    if (head.status === 401 || head.status === 403) return { outcome: 'token-invalid' }
    if (head.ok) sha = (await head.json()).sha

    const put = await fetch(api, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: payload.message || 'Update catalogue from Admin Panel',
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    })

    if (put.ok) return { outcome: 'ok' }
    if (put.status === 401 || put.status === 403) return { outcome: 'token-invalid' }
    if (put.status === 409 || put.status === 422) {
      return { outcome: 'error', detail: 'The file changed on GitHub since this page loaded. Reload, then publish again.' }
    }
    return { outcome: 'error', detail: `GitHub responded ${put.status}` }
  } catch {
    return { outcome: 'offline' }
  }
}

async function run(payload) {
  inFlight = true
  emit('syncing')

  let result = await publishViaServer(payload)
  if (result.outcome === 'unavailable') result = await publishViaBrowser(payload)

  inFlight = false

  if (result.outcome === 'ok') emit('synced', { time: stamp() })
  else if (result.outcome === 'token-needed') emit('token-needed')
  else if (result.outcome === 'token-invalid') emit('token-invalid')
  else if (result.outcome === 'offline') emit('offline')
  else emit('error', { detail: result.detail || null })

  /*  Anything that arrived while the request was in flight goes now, so
      the remote file always ends up matching the last local edit. */
  if (queued) {
    const next = queued
    queued = null
    run(next)
  }
  return result.outcome === 'ok'
}

/*  Queue a publish. Coalesces bursts of edits into one commit. */
export function syncToGitHub(products, subcategories, removedSubcategories, message) {
  const payload = buildPayload(products, subcategories, removedSubcategories, message)
  if (inFlight) { queued = payload; return }
  emit('pending')
  clearTimeout(timer)
  timer = setTimeout(() => run(payload), DEBOUNCE_MS)
}

/*  Publish immediately — the Publish button, and the retry after a
    token is corrected. */
export function syncNow(products, subcategories, removedSubcategories, message) {
  const payload = buildPayload(products, subcategories, removedSubcategories, message)
  clearTimeout(timer)
  if (inFlight) { queued = payload; return Promise.resolve(false) }
  return run(payload)
}

export function getSyncState() { return state }
