import { RANGES } from './data'
import { syncToGitHub } from './githubSync'
import initialData from '../data/products.json'

const KEY = 'casa-and-crop:products'
const SUB_KEY = 'casa-and-crop:subcategories'
const REMOVED_SUB_KEY = 'casa-and-crop:removed-subcategories'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function read() {
  try {
    const item = localStorage.getItem(KEY)
    if (item === null && initialData?.products) {
      localStorage.setItem(KEY, JSON.stringify(initialData.products))
      return initialData.products
    }
    return JSON.parse(item || '[]')
  } catch {
    return initialData?.products || []
  }
}

function triggerAutoSync() {
  const p = read()
  const s = readSubcategories()
  const r = readRemovedSubcategories()
  syncToGitHub(p, s, r)
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
  triggerAutoSync()
}

export function getProducts() { return read() }

export function getProductsByRange(rangeSlug) {
  return read().filter(p => p.category === rangeSlug)
}

export function addProduct(product) {
  const entry = { ...product, id: uid(), addedAt: Date.now() }
  write([...read(), entry])
  return entry
}

export function updateProduct(id, changes) {
  write(read().map(p => p.id === id ? { ...p, ...changes } : p))
}

export function deleteProduct(id) {
  write(read().filter(p => p.id !== id))
}

/* ── Custom Subcategories API ──────────────────────────────── */

function readSubcategories() {
  try {
    const item = localStorage.getItem(SUB_KEY)
    if (item === null && initialData?.subcategories) {
      localStorage.setItem(SUB_KEY, JSON.stringify(initialData.subcategories))
      return initialData.subcategories
    }
    return JSON.parse(item || '{}')
  } catch {
    return initialData?.subcategories || {}
  }
}

function writeSubcategories(data) {
  localStorage.setItem(SUB_KEY, JSON.stringify(data))
  window.dispatchEvent(new StorageEvent('storage', { key: SUB_KEY }))
  triggerAutoSync()
}

function readRemovedSubcategories() {
  try {
    const item = localStorage.getItem(REMOVED_SUB_KEY)
    if (item === null && initialData?.removedSubcategories) {
      localStorage.setItem(REMOVED_SUB_KEY, JSON.stringify(initialData.removedSubcategories))
      return initialData.removedSubcategories
    }
    return JSON.parse(item || '{}')
  } catch {
    return initialData?.removedSubcategories || {}
  }
}

function writeRemovedSubcategories(data) {
  localStorage.setItem(REMOVED_SUB_KEY, JSON.stringify(data))
  window.dispatchEvent(new StorageEvent('storage', { key: REMOVED_SUB_KEY }))
  triggerAutoSync()
}

export function getSubcategories(categorySlug) {
  const defaults = RANGES[categorySlug]?.subcategories || []
  const customMap = readSubcategories()
  const customList = customMap[categorySlug] || []
  const removedMap = readRemovedSubcategories()
  const removedList = removedMap[categorySlug] || []

  const combined = [...defaults]
  for (const item of customList) {
    if (!combined.includes(item)) {
      combined.push(item)
    }
  }
  return combined.filter(item => !removedList.includes(item))
}

export function getCustomSubcategoriesOnly(categorySlug) {
  const customMap = readSubcategories()
  return customMap[categorySlug] || []
}

export function addSubcategory(categorySlug, name) {
  const cleanName = (name || '').trim()
  if (!cleanName || !categorySlug) return false

  // Un-remove if it was previously removed
  const removedMap = readRemovedSubcategories()
  if (removedMap[categorySlug] && removedMap[categorySlug].includes(cleanName)) {
    removedMap[categorySlug] = removedMap[categorySlug].filter(s => s !== cleanName)
    writeRemovedSubcategories(removedMap)
  }

  const map = readSubcategories()
  const list = map[categorySlug] || []
  if (!list.includes(cleanName)) {
    map[categorySlug] = [...list, cleanName]
    writeSubcategories(map)
  }
  return true
}

export function removeSubcategory(categorySlug, name) {
  const cleanName = (name || '').trim()
  if (!cleanName || !categorySlug) return

  // Remove from custom list
  const customMap = readSubcategories()
  if (customMap[categorySlug]) {
    customMap[categorySlug] = customMap[categorySlug].filter(s => s !== cleanName)
    writeSubcategories(customMap)
  }

  // Add to removed list
  const removedMap = readRemovedSubcategories()
  const list = removedMap[categorySlug] || []
  if (!list.includes(cleanName)) {
    removedMap[categorySlug] = [...list, cleanName]
    writeRemovedSubcategories(removedMap)
  }
}

export function subscribe(fn) {
  const handler = (e) => {
    if (!e.key || e.key === KEY || e.key === SUB_KEY || e.key === REMOVED_SUB_KEY) fn(read())
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
