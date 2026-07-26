import { useEffect, useRef, useState } from 'react'
import { RANGES, ORDER } from '../../lib/data'
import { getProducts, addProduct, updateProduct, deleteProduct, subscribe } from '../../lib/products'
import { useDragScroll } from '../../lib/useDragScroll'
import s from './Admin.module.css'

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

  useEffect(() => subscribe(setProducts), [])

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

  const onSave = () => {
    if (!form.name.trim()) return
    if (sheet === 'add') addProduct(form)
    else updateProduct(sheet, form)
    close()
  }

  const onDelete = (id) => {
    if (confirmId === id) { deleteProduct(id); setConfirmId(null) }
    else setConfirmId(id)
  }

  const subs = RANGES[form.category]?.subcategories || []

  return (
    <div className={s.root}>
      {/* Header */}
      <header className={s.header}>
        <a className={s.brand} href="/casa.html">
          <span>Casa</span> Admin
        </a>
        <button className={s.addBtn} onClick={openAdd}>＋ Add</button>
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
              <button
                className={s.delBtn}
                data-confirm={confirmId === p.id ? '' : undefined}
                onClick={e => { e.stopPropagation(); onDelete(p.id) }}
                aria-label="Delete product"
              >
                {confirmId === p.id ? '✓' : '×'}
              </button>
            </div>
          ))
        )}
      </main>

      {/* Floating add button — mobile only */}
      <button className={s.fab} onClick={openAdd}>＋ Add product</button>

      {/* Sheet overlay */}
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
                <Field label="Alloy" value={form.alloy}
                  onChange={v => set('alloy', v)} placeholder={RANGES[form.category]?.spec?.[0]?.[1]} />
                <Field label="Finish" value={form.finish}
                  onChange={v => set('finish', v)} placeholder={RANGES[form.category]?.spec?.[1]?.[1]} />
              </div>

              <button className={s.saveBtn} onClick={onSave}
                disabled={!form.name.trim()}>
                {sheet === 'add' ? 'Add product' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
