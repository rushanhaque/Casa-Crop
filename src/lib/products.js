import { RANGES, ORDER } from './data'
import { syncNow } from './githubSync'
import { stageInlinePhotos } from './photos'
import initialData from '../data/products.json'

const KEY = 'casa-and-crop:products'
const SUB_KEY = 'casa-and-crop:subcategories'
const REMOVED_SUB_KEY = 'casa-and-crop:removed-subcategories'
/*  Which published snapshot this browser's localStorage was seeded from,
    and whether it has drifted from that snapshot since. */
const STAMP_KEY = 'casa-and-crop:data-stamp'
const DIRTY_KEY = 'casa-and-crop:unpublished'

const EVENT = 'casa-and-crop:data'

/*  Only the admin panel keeps a working copy in localStorage.

    Every other page reads the published catalogue directly, and never
    localStorage. That split matters: localStorage carries an
    "unpublished edits" flag, and any device that ever opened the admin
    panel and touched something would otherwise be frozen on that
    device's stale copy FOREVER, because the flag exists precisely to
    stop incoming data overwriting local work. A visitor's phone has no
    local work to protect, so it should simply show what is published.

    Splitting on the path rather than forcing an overwrite is deliberate
    — the admin's own browser visits the public pages too, and a public
    page that overwrote localStorage would destroy unpublished work from
    the other tab. */
const IS_ADMIN =
  typeof location !== 'undefined' && /^\/admin(\/|$|\.html)/.test(location.pathname)

/*  The published catalogue as this page currently understands it:
    the bundled snapshot at first, replaced by the live file once the
    fetch below lands. */
let live = initialData

/*  Where the snapshot in `live` came from. The live endpoint outranks
    the static build artifact, which outranks the copy compiled into
    this bundle — so a momentary failure of the first cannot demote the
    page back to a catalogue that is a deploy behind. */
let liveSource = 'bundle' // 'bundle' | 'static' | 'endpoint'

/*  The catalogue read live from the repository, so a publish reaches
    every device without waiting for — or depending on — a rebuild.
    /products.json remains as the fallback for when that endpoint is
    unreachable, and is only as fresh as the last successful deploy. */
const LIVE_URL = '/api/catalogue'
const STATIC_URL = '/products.json'

export function getLiveStamp() { return live?.updatedAt || '' }

/* ── storage plumbing ──────────────────────────────────────────── */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return undefined
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

/*  Returns whether the write actually happened.

    This used to swallow the exception silently, which produced the
    worst bug in the panel: a browser whose localStorage was full would
    accept a new product, show it in the grid, report "saved" — and lose
    it on the next reload, because it was never written. Photos are
    stored inline as data URIs, so a catalogue of a few dozen products
    crosses the ~5MB quota easily, and every operator hits this
    eventually. A failure has to be loud. */
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    storageError = null
    return true
  } catch (err) {
    storageError =
      err?.name === 'QuotaExceededError' || /quota/i.test(String(err?.message || err))
        ? 'This browser has run out of local storage — the catalogue photos have filled it. ' +
          'Publish now to save your work, then replace the heaviest photos with smaller ones.'
        : `This browser refused to save locally: ${err?.message || err}`
    return false
  }
}

let storageError = null

/*  The last local-write failure, or null. The admin panel reads this
    after every edit so a silent loss becomes a visible one. */
export function getStorageError() { return storageError }

/*  The published file is the source of truth; localStorage is a working
    copy of it. When a newer snapshot ships with the bundle — because
    somebody published from another device and the site redeployed — the
    working copy is replaced, UNLESS this browser is holding edits that
    were never published. Losing an unpublished edit to a deploy is the
    one outcome worth guarding against; everything else should converge
    on the file.

    Without this, an admin who published from their phone would open the
    panel on their laptop and see the old catalogue indefinitely, because
    the old code seeded localStorage exactly once and never looked again.

    Runs on module load, before any read can observe stale state. */
function applyPublished(snapshot) {
  if (typeof localStorage === 'undefined') return false

  const published = snapshot?.updatedAt || ''
  let seeded = ''
  let dirty = false
  let firstRun = true
  try {
    seeded = localStorage.getItem(STAMP_KEY) || ''
    dirty = localStorage.getItem(DIRTY_KEY) === 'true'
    firstRun = localStorage.getItem(KEY) === null
  } catch {
    return false
  }

  if (!firstRun && (dirty || published <= seeded)) return false

  writeJSON(KEY, snapshot?.products || [])
  writeJSON(SUB_KEY, snapshot?.subcategories || {})
  writeJSON(REMOVED_SUB_KEY, snapshot?.removedSubcategories || {})
  try {
    localStorage.setItem(STAMP_KEY, published)
    localStorage.setItem(DIRTY_KEY, 'false')
  } catch { /* quota */ }
  return true
}

/*  Seed the admin's working copy from the snapshot compiled into this
    bundle — correct at build time, and only as fresh as the bundle the
    browser happens to be holding, which is why the fetch below follows.

    Admin only: a public page has no working copy, and writing one from
    a public page would risk clobbering unpublished edits made in an
    admin tab on the same browser. */
if (IS_ADMIN) applyPublished(initialData)

/*  The snapshot as it stands RIGHT NOW.

    The bundled copy above is not enough on its own, and neither is the
    static /products.json beside it. Both are build artifacts: a publish
    commits the catalogue, the host rebuilds, and only then do they
    change. Everything between the publish and the end of that rebuild —
    or all of time, if the build is failing or auto-deploy is off — every
    device is served the previous catalogue while the panel says
    "Published".

    /api/catalogue reads the file out of the repository per request, so
    it reflects a publish within seconds and does not care whether a
    build ever happens. The static file stays as the fallback for when
    that endpoint is unreachable.

    Ordering matters on failure: a static file that is a deploy behind
    must never replace a snapshot already taken from the live endpoint,
    or a transient blip would visibly roll the catalogue backwards. */
async function fetchSnapshot(url, bust) {
  const res = await fetch(bust ? `${url}${url.includes('?') ? '&' : '?'}fresh=${Date.now()}` : url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  if (!res.headers.get('content-type')?.includes('json')) return null
  const snapshot = await res.json()
  return Array.isArray(snapshot?.products) ? snapshot : null
}

let refreshing = null

export function refreshFromPublished({ force = false } = {}) {
  /*  One request at a time. The triggers below can fire together — a
      tab restored from the back/forward cache is both visible and
      focused in the same frame — and three identical fetches answer
      three times, re-rendering the page for each. */
  if (refreshing && !force) return refreshing
  refreshing = doRefresh(force).finally(() => { refreshing = null })
  return refreshing
}

async function doRefresh(force) {
  if (typeof fetch === 'undefined') return false

  let snapshot = null
  let source = null

  try {
    snapshot = await fetchSnapshot(LIVE_URL, force)
    if (snapshot) source = 'endpoint'
  } catch { /* fall through to the static copy */ }

  if (!snapshot) {
    try {
      snapshot = await fetchSnapshot(STATIC_URL, true)
      if (snapshot) source = 'static'
    } catch {
      /*  Offline, or neither route is deployed yet. Whatever is in
          `live` already — bundled at worst — still renders the page. */
      return false
    }
  }
  if (!snapshot) return false

  /*  Never accept a snapshot older than the one we already have.
      This stops a cached response from the live endpoint overwriting
      a fresh catalogue that just shipped with the bundle. */
  if ((snapshot.updatedAt || '') < (live?.updatedAt || '')) return false

  /*  A static answer of the same age does not outrank the live endpoint. */
  if (source === 'static' && liveSource === 'endpoint') {
    if ((snapshot.updatedAt || '') === (live?.updatedAt || '')) return false
  }

  const changed = (snapshot.updatedAt || '') !== (live?.updatedAt || '')
  live = snapshot
  liveSource = source

  /*  Admin: seed the working copy too, under the guard that protects
      edits which have not been published yet. */
  const seeded = IS_ADMIN ? applyPublished(snapshot) : false

  if (!changed && !seeded) return false
  announce()
  return true
}

refreshFromPublished()

/*  WHEN TO RE-CHECK.

    A device should never be able to sit on a catalogue it has outgrown,
    and there are more ways for that to happen than "the tab was
    reloaded". Each listener below covers a hole that produced a
    genuinely stuck device:

    visibilitychange — the tab was in the background while a publish
      happened. This is the common one: a phone with the range page open
      in a background tab, picked up an hour later.

    pageshow with persisted — restored from the back/forward cache. The
      page is resurrected wholesale, module state and all; no script
      re-runs and visibilitychange does not fire, so without this the
      browser is showing a frozen snapshot of a page from days ago.
      Pressing Back after visiting a product is enough to land here.

    online — the device was offline when it loaded, so every fetch above
      failed and it fell all the way back to the bundled snapshot. That
      state has to end the moment the network returns.

    the interval — a display left on one page for a day, never hidden,
      never navigated. Sixty seconds of staleness is invisible to a
      visitor; a day of it is the bug being reported. The request is
      conditional and answers 304 with no body when nothing has changed,
      and it is suspended while the tab is hidden.                     */
if (typeof document !== 'undefined') {
  const recheck = () => {
    if (document.visibilityState === 'visible') refreshFromPublished()
  }

  document.addEventListener('visibilitychange', recheck)
  window.addEventListener('focus', recheck)
  window.addEventListener('online', () => refreshFromPublished({ force: true }))
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) refreshFromPublished({ force: true })
  })

  const POLL_MS = 60_000
  let timer = null
  const startPolling = () => {
    if (timer !== null) return
    timer = setInterval(recheck, POLL_MS)
  }
  const stopPolling = () => {
    if (timer === null) return
    clearInterval(timer)
    timer = null
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startPolling()
    else stopPolling()
  })
  if (document.visibilityState === 'visible') startPolling()
}

/*  Throw away this browser's working copy and take the published file as
    it stands. reconcileWithPublished() deliberately will not do this
    while there are unpublished edits — that guard is what stops a deploy
    eating someone's work — so there has to be a deliberate way to ask
    for it when the local copy is the thing that is wrong. */
export async function resetToPublished() {
  /*  Clear the guard first: applyPublished refuses to overwrite a dirty
      working copy, and discarding that copy is the entire point here. */
  try {
    localStorage.setItem(DIRTY_KEY, 'false')
    localStorage.setItem(STAMP_KEY, '')
  } catch { /* quota */ }

  /*  Prefer the live file over the bundled one — "discard local
      changes" should land on the catalogue as it stands now, not as it
      stood when this bundle was built. */
  if (!(await refreshFromPublished({ force: true }))) {
    /*  Nothing on the wire answered, so the bundled snapshot is the
        best copy that exists on this device. It is still an improvement
        on the discarded working copy, which is by definition the thing
        the operator just said was wrong. */
    applyPublished(initialData)
  }
  announce()
}

function markDirty(dirty) {
  try { localStorage.setItem(DIRTY_KEY, dirty ? 'true' : 'false') } catch { /* quota */ }
}

export function hasUnpublishedChanges() {
  try { return localStorage.getItem(DIRTY_KEY) === 'true' } catch { return false }
}

/*  The publish stamp this browser's working copy was last in agreement
    with. Compared against the live stamp, it answers the question the
    panel could not previously ask: has the catalogue moved on somewhere
    else since the edits sitting in this browser were made? */
export function getLocalBaseStamp() {
  try { return localStorage.getItem(STAMP_KEY) || '' } catch { return '' }
}

function announce() {
  window.dispatchEvent(new CustomEvent(EVENT))
  /*  Kept so other tabs, which only ever see the native StorageEvent,
      still refresh. */
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/* ── reads ─────────────────────────────────────────────────────── */

function read() {
  if (!IS_ADMIN) return live?.products ?? []
  return readJSON(KEY, []) ?? initialData?.products ?? []
}

function readSubcategories() {
  if (!IS_ADMIN) return live?.subcategories ?? {}
  return readJSON(SUB_KEY, {}) ?? initialData?.subcategories ?? {}
}

function readRemovedSubcategories() {
  if (!IS_ADMIN) return live?.removedSubcategories ?? {}
  return readJSON(REMOVED_SUB_KEY, {}) ?? initialData?.removedSubcategories ?? {}
}

export function getProducts() { return read() }

export function getProductsByRange(rangeSlug) {
  return read().filter(p => p.category === rangeSlug)
}

/* ── writes ────────────────────────────────────────────────────── */

function commit(products, message) {
  writeJSON(KEY, products)
  markDirty(true)
  announce()
}

export function addProduct(product) {
  const entry = { ...product, id: uid(), addedAt: Date.now(), updatedAt: Date.now() }
  commit([...read(), entry], 'Add product: ' + (entry.name || entry.sku || 'untitled'))
  return entry
}

export function updateProduct(id, changes) {
  const next = read().map(p => (p.id === id ? { ...p, ...changes, updatedAt: Date.now() } : p))
  const name = changes.name || next.find(p => p.id === id)?.name || id
  commit(next, 'Update product: ' + name)
}

export function deleteProduct(id) {
  const gone = read().find(p => p.id === id)
  commit(read().filter(p => p.id !== id), 'Delete product: ' + (gone?.name || id))
}

/* ── SKU ───────────────────────────────────────────────────────── */

/*  The public product page resolves a product by its SKU — /product?sku=…
    — so a product without one, or sharing one with another product, is
    either unreachable or reachable as the wrong item. Both are silent
    failures on the live site, which is why the SKU is generated rather
    than left to be typed, and validated rather than trusted. */

const PREFIX = {
  funeral: 'FUN', lighting: 'LIT', kitchenware: 'KIT',
  decor: 'DEC', accessories: 'ACC', furniture: 'FUR',
}

export function skuPrefix(categorySlug) {
  return 'CC-' + (PREFIX[categorySlug] || (categorySlug || 'GEN').slice(0, 3).toUpperCase()) + '-'
}

export function nextSku(categorySlug) {
  const prefix = skuPrefix(categorySlug)
  const highest = read()
    .filter(p => typeof p.sku === 'string' && p.sku.startsWith(prefix))
    .map(p => parseInt(p.sku.slice(prefix.length), 10))
    .filter(n => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0)
  return prefix + String(highest + 1).padStart(3, '0')
}

export function isSkuTaken(sku, exceptId) {
  const clean = (sku || '').trim().toLowerCase()
  if (!clean) return false
  return read().some(p => p.id !== exceptId && (p.sku || '').trim().toLowerCase() === clean)
}

/* ── subcategories ─────────────────────────────────────────────── */

function commitSubs(map, removed, message) {
  if (map) writeJSON(SUB_KEY, map)
  if (removed) writeJSON(REMOVED_SUB_KEY, removed)
  markDirty(true)
  announce()
}

export function getSubcategories(categorySlug) {
  const defaults = RANGES[categorySlug]?.subcategories || []
  const custom = readSubcategories()[categorySlug] || []
  const removed = readRemovedSubcategories()[categorySlug] || []

  const combined = [...defaults]
  for (const item of custom) if (!combined.includes(item)) combined.push(item)
  return combined.filter(item => !removed.includes(item))
}

export function isCustomSubcategory(categorySlug, name) {
  return (readSubcategories()[categorySlug] || []).includes(name)
}

export function addSubcategory(categorySlug, name) {
  const clean = (name || '').trim()
  if (!clean || !categorySlug) return false
  if (getSubcategories(categorySlug).includes(clean)) return false

  const removed = readRemovedSubcategories()
  if (removed[categorySlug]?.includes(clean)) {
    removed[categorySlug] = removed[categorySlug].filter(s => s !== clean)
  }

  const map = readSubcategories()
  const list = map[categorySlug] || []
  if (!list.includes(clean)) map[categorySlug] = [...list, clean]

  commitSubs(map, removed, 'Add subcategory: ' + clean)
  return true
}

export function removeSubcategory(categorySlug, name) {
  const clean = (name || '').trim()
  if (!clean || !categorySlug) return

  const map = readSubcategories()
  if (map[categorySlug]) map[categorySlug] = map[categorySlug].filter(s => s !== clean)

  const removed = readRemovedSubcategories()
  const list = removed[categorySlug] || []
  if (!list.includes(clean)) removed[categorySlug] = [...list, clean]

  commitSubs(map, removed, 'Remove subcategory: ' + clean)
}

/*  How many products a subcategory removal would orphan. The operator
    should not discover this after the fact. */
export function countProductsInSubcategory(categorySlug, name) {
  return read().filter(p => p.category === categorySlug && p.subcategory === name).length
}

/* ── publishing ────────────────────────────────────────────────── */

/*  How long to keep asking the live endpoint whether it can see the
    catalogue that was just written. GitHub is usually consistent within
    a second or two; ten seconds of polling is generous and costs
    nothing when the first attempt already succeeds. */
const VERIFY_ATTEMPTS = 10
const VERIFY_DELAY_MS = 1000

const wait = (ms) => new Promise(r => setTimeout(r, ms))

/*  Publishing is not finished when GitHub accepts the write — it is
    finished when the endpoint every other device reads from can see it.
    Those are different moments, and the gap between them is exactly
    where "I published it and my phone still shows the old one" lived.
    Confirming it here means the panel's "Published" badge states
    something that has been checked rather than assumed. */
async function verifyPublished(expected) {
  if (!expected) return false
  for (let i = 0; i < VERIFY_ATTEMPTS; i++) {
    try {
      const snapshot = await fetchSnapshot(LIVE_URL, true)
      if (snapshot && (snapshot.updatedAt || '') >= expected) {
        live = snapshot
        liveSource = 'endpoint'
        announce()
        return true
      }
    } catch { /* keep trying */ }
    await wait(VERIFY_DELAY_MS)
  }
  return false
}

export async function publishToGitHub(message, onPhotoProgress) {
  /*  Photos still held inline are filed into the repository first, and
      the catalogue is rewritten to point at them. Everything the
      staging step produced is committed in the SAME commit as the
      catalogue, so the site is never describing a product whose image
      does not exist yet.

      A photo that cannot be staged keeps its data URL and publishes
      inline, which is the behaviour the panel had before photos became
      files — worse, but never a lost photo. */
  const { products: filed, photos } = await stageInlinePhotos(read(), onPhotoProgress)

  const result = await syncNow(
    filed, readSubcategories(), readRemovedSubcategories(),
    message || 'Publish catalogue from Admin Panel',
    photos,
  )
  if (!result?.ok) return false

  /*  Only now is the local copy rewritten to use paths.

      Staged blobs are loose until the commit references them, so a
      catalogue pointing at those paths is a catalogue of broken images
      until the publish succeeds. Writing this before knowing it landed
      would turn a failed publish into permanently missing photos. */
  if (photos.length) writeJSON(KEY, filed)

  markDirty(false)

  /*  Advance the stamp to the one the server wrote.

      This browser's working copy and the published file now describe
      the same catalogue, and the stamp is what says so. Taking the
      SERVER's stamp rather than this browser's clock matters: a device
      running a few minutes fast would otherwise write a stamp from the
      future, and then reject every genuine publish made from anywhere
      else until real time caught up with it. That is one device
      silently frozen on its own copy of the catalogue — which is the
      whole class of bug this is meant to end. */
  const stamped = result.updatedAt || new Date().toISOString()
  try { localStorage.setItem(STAMP_KEY, stamped) } catch { /* quota */ }
  announce()

  /*  Best-effort: an unverified publish is still a successful one, and
      the endpoint will catch up on its own. The caller is told whether
      it was seen so it can say so. */
  const seen = await verifyPublished(result.updatedAt)
  return { ok: true, verified: seen, updatedAt: stamped }
}

/* ── subscription ──────────────────────────────────────────────── */

export function subscribe(fn) {
  const handler = () => fn(read())
  const storageHandler = (e) => {
    if (!e.key || e.key === KEY || e.key === SUB_KEY || e.key === REMOVED_SUB_KEY) fn(read())
  }
  window.addEventListener(EVENT, handler)
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener(EVENT, handler)
    window.removeEventListener('storage', storageHandler)
  }
}

export { ORDER }
