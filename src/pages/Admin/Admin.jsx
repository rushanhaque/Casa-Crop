import { useEffect, useRef, useState } from 'react'
import { RANGES, ORDER } from '../../lib/data'
import {
  getProducts, addProduct, updateProduct, deleteProduct, subscribe,
  getSubcategories, getCustomSubcategoriesOnly, addSubcategory, removeSubcategory,
  publishToGitHub
} from '../../lib/products'
import { subscribeSyncStatus } from '../../lib/githubSync'
import { useDragScroll } from '../../lib/useDragScroll'
import s from './Admin.module.css'

const AUTH_KEY = 'casa-and-crop:admin-authed'
const ADMIN_PASSWORD = 'Publish@Casa'

const EMPTY = {
  name: '', sku: '', category: ORDER[0], subcategory: '',
  alloy: '', finish: '', photo: '',
}

function Field({ label, value, onChange, placeholder, hint }) {
  return (
    <div className={s.field}>
      <label className={s.label}>{label}</label>
      <input className={s.input} type="text" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <span className={s.hint}>{hint}</span>}
    </div>
  )
}

export default function Admin() {
  const [products, setProducts] = useState(getProducts)
  const [tab, setTab] = useState('all')
  const scrollRef = useDragScroll()
  const [sheet, setSheet] = useState(null) // null | 'add' | product.id
  const [form, setForm] = useState(EMPTY)
  const [preview, setPreview] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const fileRef = useRef(null)

  /* Authentication State */
  const [isAuthed, setIsAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === 'true')
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState('')

  /* Subcategory management state */
  const [subModal, setSubModal] = useState(false)
  const [subCategorySlug, setSubCategorySlug] = useState(ORDER[0])
  const [subManageInput, setSubManageInput] = useState('')

  /* Confirmation Popup state */
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  // null | { type: 'product', id: string, name: string } | { type: 'subcategory', categorySlug: string, name: string }

  /* GitHub Sync state */
  const [syncState, setSyncState] = useState({ status: 'idle', time: null })

  useEffect(() => subscribe(setProducts), [])
  useEffect(() => subscribeSyncStatus(setSyncState), [])

  const visible = tab === 'all' ? products : products.filter(p => p.category === tab)

  const openAdd = () => {
    setForm(EMPTY)
    setPreview('')
    setSheet('add')
  }

  const openEdit = (p) => {
    setForm(p)
    setPreview(p.photo || '')
    setSheet(p.id)
  }

  const close = () => { setSheet(null); setConfirmId(null) }

  const set = (key, val) => setForm(f => {
    const next = { ...f, [key]: val }
    if (key === 'category') {
      next.subcategory = ''
      next.sku = `CC-${val.slice(0, 3).toUpperCase()}-`
    }
    return next
  })

  const handleManagerAddSub = () => {
    const clean = subManageInput.trim()
    if (clean) {
      addSubcategory(subCategorySlug, clean)
      setSubManageInput('')
    }
  }

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setPreview(ev.target.result)
      setForm(f => ({ ...f, photo: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const onSave = (e) => {
    if (e) e.preventDefault()
    if (!form.name || !form.name.trim()) {
      alert('Please enter a Product Name.')
      return
    }
    if (sheet === 'add') addProduct(form)
    else updateProduct(sheet, form)
    close()
  }

  const handleAuthSubmit = (e) => {
    e.preventDefault()
    if (passInput === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true')
      setIsAuthed(true)
      setPassError('')
    } else {
      setPassError('Incorrect password. Please try again.')
    }
  }

  if (!isAuthed) {
    return (
      <div className={s.authRoot}>
        <div className={s.authCard}>
          <div className={s.authIcon}>🔒</div>
          <h2 className={s.authTitle}>Casa Admin Portal</h2>
          <p className={s.authSubtitle}>Enter password to unlock administrative controls & publishing</p>
          <form onSubmit={handleAuthSubmit}>
            <div className={s.field} style={{ marginBottom: '1.2rem' }}>
              <input
                type="password"
                className={s.input}
                placeholder="Enter password..."
                value={passInput}
                onChange={e => {
                  setPassInput(e.target.value)
                  setPassError('')
                }}
                autoFocus
              />
              {passError && (
                <span style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.4rem', display: 'block', textAlign: 'left' }}>
                  {passError}
                </span>
              )}
            </div>
            <button type="submit" className={s.saveBtn}>
              Unlock Admin
            </button>
          </form>
        </div>
      </div>
    )
  }

  const subs = getSubcategories(form.category)

  return (
    <div className={s.root}>
      {/* Header */}
      <header className={s.header}>
        <a className={s.brand} href="/casa.html">
          <span>Casa</span> Admin
        </a>
        <div className={s.headerActions}>
          <div
            className={s.syncBadge}
            data-status={syncState.status}
            onClick={() => {
              if (syncState.status === 'error' || syncState.status === 'token-invalid') {
                const tok = prompt('Enter your GitHub Personal Access Token:')
                if (tok && tok.trim()) {
                  localStorage.setItem('casa-and-crop:github-token', tok.trim())
                  publishToGitHub()
                }
              }
            }}
            style={{ cursor: (syncState.status === 'error' || syncState.status === 'token-invalid') ? 'pointer' : 'default' }}
            title={syncState.status === 'token-invalid' ? 'Click to set valid GitHub Token' : 'Automatic GitHub Repository Sync'}
          >
            {syncState.status === 'syncing' && '⏳ Syncing to GitHub...'}
            {syncState.status === 'synced' && `🟢 Synced (${syncState.time})`}
            {syncState.status === 'token-invalid' && '⚠️ Token Invalid (Tap to set)'}
            {syncState.status === 'error' && '⚠️ Sync Error (Tap to retry)'}
            {syncState.status === 'idle' && '🟢 Live GitHub Ready'}
          </div>
          <button className={s.publishBtn} onClick={publishToGitHub} title="Publish latest products to live site">
            Publish
          </button>
          <button className={s.subBtn} onClick={() => setSubModal(true)}>
            <span className={s.subBtnFull}>＋ Subcategories</span>
            <span className={s.subBtnShort} aria-hidden="true">⊞ Sub</span>
          </button>
          <button className={s.addBtn} onClick={openAdd}>＋ Add</button>
        </div>
      </header>

      {/* Category tabs */}
      <div ref={scrollRef} className={s.tabs}>
        {[['all', 'All'], ...ORDER.map(slug => [slug, RANGES[slug].name])].map(([val, label]) => (
          <button key={val} className={s.tab}
            data-active={tab === val ? '' : undefined}
            onClick={() => setTab(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Product list */}
      <main className={s.list}>
        {visible.length === 0 ? (
          <div className={s.empty}>
            <p>No products yet.</p>
            <button className={s.emptyAdd} onClick={openAdd}>Add your first product</button>
          </div>
        ) : (
          visible.map(p => (
            <div key={p.id} className={s.row} onClick={() => openEdit(p)}>
              <div className={s.thumb}>
                {p.photo
                  ? <img src={p.photo} alt="" className={s.thumbImg} />
                  : <span className={s.thumbEmpty}>{RANGES[p.category]?.name?.[0]}</span>}
              </div>
              <div className={s.rowBody}>
                <span className={s.rowName}>{p.name}</span>
                <span className={s.rowMeta}>
                  {p.sku && <>{p.sku} · </>}
                  {RANGES[p.category]?.name}
                  {p.subcategory && <> · {p.subcategory}</>}
                </span>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Floating add button — mobile only */}
      <button className={s.fab} onClick={openAdd}>＋ Add product</button>

      {/* Product Sheet overlay */}
      {sheet && (
        <div className={s.overlay} onClick={close}>
          <div className={s.sheet} onClick={e => e.stopPropagation()}>
            <div className={s.sheetBar}>
              <span className={s.sheetHandle} />
            </div>
            <div className={s.sheetHead}>
              <span className={s.sheetTitle}>{sheet === 'add' ? 'Add Product' : 'Edit Product'}</span>
              <button className={s.sheetClose} onClick={close}>×</button>
            </div>

            <div className={s.sheetBody}>
              {/* Photo upload */}
              <button className={s.photoZone} onClick={() => fileRef.current?.click()}>
                {preview
                  ? <img src={preview} alt="" className={s.photoImg} />
                  : <span className={s.photoPrompt}>Tap to upload photo</span>}
                <input ref={fileRef} type="file" accept="image/*"
                  onChange={onPhoto} className={s.photoInput} />
              </button>

              <Field label="Product name *" value={form.name}
                onChange={v => set('name', v)} placeholder="e.g. Brass Cremation Urn" />

              <div className={s.row2}>
                <div className={s.field}>
                  <label className={s.label}>Category *</label>
                  <select className={s.select} value={form.category}
                    onChange={e => set('category', e.target.value)}>
                    {ORDER.map(slug => (
                      <option key={slug} value={slug}>{RANGES[slug].name}</option>
                    ))}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Subcategory</label>
                  <select className={s.select} value={form.subcategory}
                    onChange={e => set('subcategory', e.target.value)}>
                    <option value="">— none —</option>
                    {subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <Field label="SKU" value={form.sku}
                onChange={v => set('sku', v)} placeholder="CC-FUN-001" />

              <div className={s.row2}>
                <Field label="Metal" value={form.alloy}
                  onChange={v => set('alloy', v)} placeholder={RANGES[form.category]?.spec?.[0]?.[1]} />
                <Field label="Finish" value={form.finish}
                  onChange={v => set('finish', v)} placeholder={RANGES[form.category]?.spec?.[1]?.[1]} />
              </div>
            </div>

            <div className={s.sheetFooter}>
              <div className={s.sheetActions}>
                {sheet !== 'add' && (
                  <button
                    type="button"
                    className={s.sheetDeleteBtn}
                    onClick={() => setDeleteConfirm({ type: 'product', id: sheet, name: form.name })}
                  >
                    Delete product
                  </button>
                )}
                <button
                  type="button"
                  className={s.saveBtn}
                  onClick={onSave}
                >
                  {sheet === 'add' ? 'Add product' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subcategories Management Modal */}
      {subModal && (
        <div className={s.overlay} onClick={() => setSubModal(false)}>
          <div className={s.sheet} onClick={e => e.stopPropagation()}>
            <div className={s.sheetBar}>
              <span className={s.sheetHandle} />
            </div>
            <div className={s.sheetHead}>
              <span className={s.sheetTitle}>Manage Subcategories</span>
              <button className={s.sheetClose} onClick={() => setSubModal(false)}>×</button>
            </div>

            <div className={s.sheetBody}>
              <div className={s.field}>
                <label className={s.label}>Category</label>
                <select
                  className={s.select}
                  value={subCategorySlug}
                  onChange={e => setSubCategorySlug(e.target.value)}
                >
                  {ORDER.map(slug => (
                    <option key={slug} value={slug}>{RANGES[slug].name}</option>
                  ))}
                </select>
              </div>

              <div className={s.field}>
                <label className={s.label}>Add New Subcategory</label>
                <div className={s.inlineAddRow}>
                  <input
                    className={s.input}
                    type="text"
                    placeholder="e.g. Vase Sets, Wall Sconces..."
                    value={subManageInput}
                    onChange={e => setSubManageInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleManagerAddSub()
                      }
                    }}
                  />
                  <button type="button" className={s.inlineSaveBtn} onClick={handleManagerAddSub}>
                    Add
                  </button>
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>
                  Current Subcategories ({RANGES[subCategorySlug]?.name})
                </label>
                <div className={s.chipList}>
                  {getSubcategories(subCategorySlug).map(sub => (
                    <span className={s.chip} key={sub}>
                      {sub}
                      <button
                        type="button"
                        className={s.chipDel}
                        onClick={() => setDeleteConfirm({ type: 'subcategory', categorySlug: subCategorySlug, name: sub })}
                        aria-label={`Remove ${sub}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {deleteConfirm && (
        <div className={s.overlay} style={{ zIndex: 100 }} onClick={() => setDeleteConfirm(null)}>
          <div className={s.confirmModal} onClick={e => e.stopPropagation()}>
            <div className={s.confirmHead}>
              <span className={s.confirmIcon}>⚠️</span>
              <h3 className={s.confirmTitle}>Permanently Delete?</h3>
            </div>
            <p className={s.confirmMessage}>
              {deleteConfirm.type === 'product'
                ? `Are you sure you want to permanently delete "${deleteConfirm.name || 'this product'}"? This action cannot be undone.`
                : `Are you sure you want to permanently delete the subcategory "${deleteConfirm.name}"? This action cannot be undone.`}
            </p>
            <div className={s.confirmActions}>
              <button
                type="button"
                className={s.confirmCancelBtn}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={s.confirmYesBtn}
                onClick={() => {
                  if (deleteConfirm.type === 'product') {
                    deleteProduct(deleteConfirm.id)
                    setDeleteConfirm(null)
                    close()
                  } else if (deleteConfirm.type === 'subcategory') {
                    removeSubcategory(deleteConfirm.categorySlug, deleteConfirm.name)
                    setDeleteConfirm(null)
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
