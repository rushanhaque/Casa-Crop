import { RANGES, ORDER } from './data'
import { syncNow } from './githubSync'
import initialData from '../data/products.json'

const KEY = 'casa-and-crop:products'
const SUB_KEY = 'casa-and-crop:subcategories'
const REMOVED_SUB_KEY = 'casa-and-crop:removed-subcategories'
/*  Which published snapshot this browser's localStorage was seeded from,
    and whether it has drifted from that snapshot since. */
const STAMP_KEY = 'casa-and-crop:data-stamp'
const DIRTY_KEY = 'casa-and-crop:unpublished'

const EVENT = 'casa-and-crop:data'

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

function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota */ }
}

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

/*  The snapshot compiled into this bundle. Correct at build time, and
    only as fresh as the bundle the browser happens to be holding. */
applyPublished(initialData)

/*  The snapshot as it stands RIGHT NOW.

    The bundled copy above is not enough on its own. A publish commits
    the catalogue, the host rebuilds, and the new JSON is baked into a
    freshly hashed bundle — but a browser that already has the old
    hashed bundle cached will not fetch it, so the device keeps showing
    the catalogue as it was the day it first loaded the site. That is
    why products added on one device never appeared on another.

    /products.json is emitted under a name that never changes and
    served must-revalidate, so this is the one request that always
    reflects the last publish. It runs through exactly the same guard
    as the bundled copy — an admin's unpublished edits are never
    overwritten — and announces only when something actually changed,
    so a no-op refresh does not re-render the page. */
export async function refreshFromPublished() {
  if (typeof fetch === 'undefined') return false
  try {
    const res = await fetch('/products.json', { cache: 'no-store' })
    if (!res.ok) return false
    if (!res.headers.get('content-type')?.includes('json')) return false
    const snapshot = await res.json()
    if (!Array.isArray(snapshot?.products)) return false
    if (!applyPublished(snapshot)) return false
    announce()
    return true
  } catch {
    /*  Offline, or the host has not deployed the file yet. The bundled
        copy already seeded localStorage, so there is nothing to do. */
    return false
  }
}

refreshFromPublished()

/*  A device left open on the range page for a day should not still be
    showing yesterday's catalogue. Re-checking when the tab is brought
    back to the foreground costs one conditional request and is the
    moment a visitor is most likely to be looking. */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshFromPublished()
  })
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
  if (!(await refreshFromPublished())) applyPublished(initialData)
  announce()
}

function markDirty(dirty) {
  try { localStorage.setItem(DIRTY_KEY, dirty ? 'true' : 'false') } catch { /* quota */ }
}

export function hasUnpublishedChanges() {
  try { return localStorage.getItem(DIRTY_KEY) === 'true' } catch { return false }
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
  return readJSON(KEY, []) ?? initialData?.products ?? []
}

function readSubcategories() {
  return readJSON(SUB_KEY, {}) ?? initialData?.subcategories ?? {}
}

function readRemovedSubcategories() {
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

export async function publishToGitHub(message) {
  const ok = await syncNow(
    read(), readSubcategories(), readRemovedSubcategories(),
    message || 'Publish catalogue from Admin Panel',
  )
  if (ok) {
    markDirty(false)
    /*  Advance the stamp to now.

        Between a publish and the host finishing its rebuild, the
        deployed /products.json is still the PREVIOUS catalogue. Without
        this, the refresh would see a file newer than the stamp this
        browser was seeded with and overwrite the very products that
        were just published — they would vanish from the admin panel
        until the deploy landed. The endpoint stamps its own write with
        the server clock, so a later genuine publish still reads as
        newer than this and wins. */
    try { localStorage.setItem(STAMP_KEY, new Date().toISOString()) } catch { /* quota */ }
    announce()
  }
  return ok
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
