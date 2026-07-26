const KEY = 'casa-and-crop:products'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
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

export function subscribe(fn) {
  const handler = (e) => { if (!e.key || e.key === KEY) fn(read()) }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
