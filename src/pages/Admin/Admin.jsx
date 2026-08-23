import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RANGES, ORDER } from '../../lib/data'
import {
  getProducts, addProduct, updateProduct, deleteProduct, subscribe,
  getSubcategories, isCustomSubcategory, addSubcategory, removeSubcategory,
  countProductsInSubcategory, publishToGitHub, hasUnpublishedChanges,
  nextSku, isSkuTaken, skuPrefix, resetToPublished,
} from '../../lib/products'
import { subscribeSyncStatus, getStoredToken, setStoredToken } from '../../lib/githubSync'
import { compressImage, formatBytes } from '../../lib/image'
import s from './Admin.module.css'

const AUTH_KEY = 'casa-and-crop:admin-authed'
const VIEW_KEY = 'casa-and-crop:admin-view'
const ADMIN_PASSWORD = 'Publish@Casa'

const EMPTY = {
  name: '', sku: '', category: ORDER[0], subcategory: '',
  alloy: '', finish: '', photo: '',
}

/*  The publish request carries the whole catalogue, photos included, and
    the serverless route caps a body at 4.5MB. Warn with headroom left. */
const PAYLOAD_WARN = 3_000_000

const SORTS = [
  ['newest', 'Newest first'],
  ['oldest', 'Oldest first'],
  ['name', 'Name A–Z'],
  ['sku', 'SKU'],
]

/*  One label per sync state, so the badge, the tooltip and the toast all
    read from the same table rather than three scattered ternaries. */
const SYNC = {
  idle:            { tone: 'neutral', label: 'Ready',            hint: 'No changes to publish yet.' },
  pending:         { tone: 'busy',    label: 'Queued',           hint: 'Changes will publish in a moment.' },
  syncing:         { tone: 'busy',    label: 'Publishing…',      hint: 'Writing to GitHub.' },
  synced:          { tone: 'ok',      label: 'Published',        hint: 'The live catalogue matches this panel.' },
  'token-needed':  { tone: 'warn',    label: 'Token needed',     hint: 'Add a GitHub token in Settings to publish.' },
  'token-invalid': { tone: 'bad',     label: 'Token rejected',   hint: 'GitHub refused the token. Update it in Settings.' },
  offline:         { tone: 'bad',     label: 'Offline',          hint: 'No connection to GitHub. Changes are saved locally.' },
  error:           { tone: 'bad',     label: 'Publish failed',   hint: 'Something went wrong. Try Publish again.' },
}

/* ── small building blocks ─────────────────────────────────────── */

function Field({ label, value, onChange, placeholder, hint, error, required, mono, ...rest }) {
  return (
    <label className={s.field}>
      <span className={s.label}>
        {label}{required && <em className={s.req} aria-hidden="true">*</em>}
      </span>
      <input
        className={s.input}
        data-mono={mono ? '' : undefined}
        data-invalid={error ? '' : undefined}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        {...rest}
      />
      {error
        ? <span className={s.errorText}>{error}</span>
        : hint ? <span className={s.hint}>{hint}</span> : null}
    </label>
  )
}

/*  A bottom sheet on a phone and a centred dialog on a desktop — the
    same element, the difference lives entirely in CSS so there is one
    focus trap, one Escape handler and one scroll container to reason
    about rather than two components that drift apart. */
function Dialog({ title, subtitle, onClose, children, footer, size }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  useEffect(() => {
    const first = panelRef.current?.querySelector('input, select, textarea, button')
    /*  Only steal focus on a pointer-capable viewport: focusing a text
        field on a phone throws the keyboard up over the sheet before the
        operator has seen what is in it. */
    if (first && window.matchMedia('(min-width: 900px)').matches) first.focus()
  }, [])

  return (
    <div className={s.scrim} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className={s.dialog}
        data-size={size || undefined}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <span className={s.grabber} aria-hidden="true" />
        <header className={s.dialogHead}>
          <div className={s.dialogHeadText}>
            <h2 className={s.dialogTitle}>{title}</h2>
            {subtitle && <p className={s.dialogSubtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className={s.dialogBody}>{children}</div>
        {footer && <footer className={s.dialogFoot}>{footer}</footer>}
      </div>
    </div>
  )
}

/*  Inline strokes rather than emoji. Emoji render at a different weight,
    baseline and colour on every platform, which is why the old header
    never aligned: 🟢 and ⏳ have different metrics from the text beside
    them and no amount of padding squares them up. */
function Icon({ name }) {
  const common = {
    width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
  }
  const paths = {
    close: <path d="M4 4l8 8M12 4l-8 8" />,
    plus: <path d="M8 3.5v9M3.5 8h9" />,
    search: <><circle cx="7.2" cy="7.2" r="4.2" /><path d="M10.4 10.4L13.5 13.5" /></>,
    upload: <><path d="M8 11V3.5" /><path d="M5 6.2L8 3.2l3 3" /><path d="M2.8 10.5v1.7a1.3 1.3 0 001.3 1.3h7.8a1.3 1.3 0 001.3-1.3v-1.7" /></>,
    trash: <><path d="M3 4.2h10" /><path d="M6.4 4.2V3a.8.8 0 01.8-.8h1.6a.8.8 0 01.8.8v1.2" /><path d="M4.4 4.2l.5 8a1 1 0 001 .9h4.2a1 1 0 001-.9l.5-8" /></>,
    grid: <><rect x="2.6" y="2.6" width="4.6" height="4.6" rx="1" /><rect x="8.8" y="2.6" width="4.6" height="4.6" rx="1" /><rect x="2.6" y="8.8" width="4.6" height="4.6" rx="1" /><rect x="8.8" y="8.8" width="4.6" height="4.6" rx="1" /></>,
    list: <><path d="M5.6 4h7.8M5.6 8h7.8M5.6 12h7.8" /><path d="M2.6 4h.01M2.6 8h.01M2.6 12h.01" /></>,
    cog: <><circle cx="8" cy="8" r="2.1" /><path d="M8 1.8v1.4M8 12.8v1.4M14.2 8h-1.4M3.2 8H1.8M12.4 3.6l-1 1M4.6 11.4l-1 1M12.4 12.4l-1-1M4.6 4.6l-1-1" /></>,
    exit: <><path d="M6 13.4H3.6a1 1 0 01-1-1V3.6a1 1 0 011-1H6" /><path d="M10.4 10.8L13.2 8l-2.8-2.8" /><path d="M13.2 8H6.2" /></>,
    tag: <><path d="M2.6 7.3V3.4a.8.8 0 01.8-.8h3.9a.8.8 0 01.57.24l5 5a.8.8 0 010 1.13l-3.9 3.9a.8.8 0 01-1.13 0l-5-5a.8.8 0 01-.24-.57z" /><circle cx="5.4" cy="5.4" r=".9" /></>,
    up: <path d="M8 12.5V4M4.5 7.5L8 4l3.5 3.5" />,
    check: <path d="M3.4 8.4l3 3 6.2-7" />,
    warn: <><path d="M8 2.6l5.6 10.2H2.4z" /><path d="M8 6.6v3M8 11.4h.01" /></>,
    link: <><path d="M6.6 9.4a2.6 2.6 0 003.9.3l1.9-1.9a2.6 2.6 0 00-3.7-3.7l-1 1" /><path d="M9.4 6.6a2.6 2.6 0 00-3.9-.3l-1.9 1.9a2.6 2.6 0 003.7 3.7l1-1" /></>,
  }
  return <svg {...common} className={s.icon}>{paths[name]}</svg>
}

function Empty({ title, body, action }) {
  return (
    <div className={s.empty}>
      <div className={s.emptyMark} aria-hidden="true"><Icon name="tag" /></div>
      <h3 className={s.emptyTitle}>{title}</h3>
      <p className={s.emptyBody}>{body}</p>
      {action}
    </div>
  )
}

/* ── auth ──────────────────────────────────────────────────────── */

function AuthGate({ onUnlock }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (pass === ADMIN_PASSWORD) onUnlock()
    else setError('That password is not correct.')
  }

  return (
    <div className={s.authRoot}>
      <form className={s.authCard} onSubmit={submit}>
        <span className={s.authMark} aria-hidden="true">C&amp;C</span>
        <h1 className={s.authTitle}>Catalogue Admin</h1>
        <p className={s.authSubtitle}>
          Sign in to add, edit and publish products to the live site.
        </p>

        <label className={s.field}>
          <span className={s.label}>Password</span>
          <input
            className={s.input}
            data-invalid={error ? '' : undefined}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            value={pass}
            onChange={e => { setPass(e.target.value); setError('') }}
            autoFocus
          />
          {error && <span className={s.errorText}>{error}</span>}
        </label>

        <button type="submit" className={s.btnPrimary} data-block="">Unlock</button>
        <p className={s.authNote}>
          This gate keeps the panel tidy — it is not a security boundary.
          Publishing is authorised on the server.
        </p>
      </form>
    </div>
  )
}

/* ── panel ─────────────────────────────────────────────────────── */

export default function Admin() {
  const [isAuthed, setIsAuthed] = useState(() => {
    try { return localStorage.getItem(AUTH_KEY) === 'true' } catch { return false }
  })

  const [products, setProducts] = useState(getProducts)
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) || 'grid' } catch { return 'grid' }
  })
  const [navOpen, setNavOpen] = useState(false)

  const [editing, setEditing] = useState(null)   // null | 'new' | product id
  const [form, setForm] = useState(EMPTY)
  const [skuTouched, setSkuTouched] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoInfo, setPhotoInfo] = useState(null)
  const [formError, setFormError] = useState({})

  const [subsOpen, setSubsOpen] = useState(false)
  const [subCategory, setSubCategory] = useState(ORDER[0])
  const [subInput, setSubInput] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tokenInput, setTokenInput] = useState('')

  const [confirm, setConfirm] = useState(null)
  const [toasts, setToasts] = useState([])
  const [sync, setSync] = useState({ status: 'idle', time: null, detail: null })
  const [dirty, setDirty] = useState(hasUnpublishedChanges)

  const fileRef = useRef(null)
  const searchRef = useRef(null)

  const toast = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, message, tone }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200)
  }, [])

  useEffect(() => subscribe(list => {
    setProducts(list)
    setDirty(hasUnpublishedChanges())
  }), [])

  useEffect(() => subscribeSyncStatus(next => {
    setSync(next)
    if (next.status === 'synced') setDirty(false)
  }), [])

  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, view) } catch { /* private mode */ }
  }, [view])

  /*  ⌘K / Ctrl-K to the search box — the single shortcut worth having in
      a panel whose main job is finding one product among many. */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /*  A browser will not let a page block its own unload with a custom
      message, but it will warn — which is the right behaviour when work
      exists only in this tab's localStorage and has not reached GitHub. */
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /* ── derived ─────────────────────────────────────────────────── */

  const counts = useMemo(() => {
    const map = { all: products.length }
    for (const slug of ORDER) map[slug] = 0
    for (const p of products) if (map[p.category] !== undefined) map[p.category] += 1
    return map
  }, [products])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = category === 'all' ? products : products.filter(p => p.category === category)

    if (q) {
      list = list.filter(p =>
        [p.name, p.sku, p.subcategory, p.alloy, p.finish, RANGES[p.category]?.name]
          .some(v => (v || '').toLowerCase().includes(q)))
    }

    const by = {
      newest: (a, b) => (b.addedAt || 0) - (a.addedAt || 0),
      oldest: (a, b) => (a.addedAt || 0) - (b.addedAt || 0),
      name: (a, b) => (a.name || '').localeCompare(b.name || ''),
      sku: (a, b) => (a.sku || '').localeCompare(b.sku || ''),
    }
    return [...list].sort(by[sort] || by.newest)
  }, [products, category, query, sort])

  /*  Every photo lives inside the JSON that gets committed, so the size
      of the catalogue is an operational number, not trivia. */
  const payloadBytes = useMemo(
    () => products.reduce((n, p) => n + (p.photo ? p.photo.length * 0.75 : 0), 0),
    [products],
  )
  const missingSku = useMemo(() => products.filter(p => !(p.sku || '').trim()).length, [products])

  const subs = getSubcategories(form.category)
  const syncMeta = SYNC[sync.status] || SYNC.idle

  /* ── product form ────────────────────────────────────────────── */

  const openNew = () => {
    setForm({ ...EMPTY, sku: nextSku(EMPTY.category) })
    setSkuTouched(false)
    setPhotoInfo(null)
    setFormError({})
    setEditing('new')
    setNavOpen(false)
  }

  const openEdit = (p) => {
    setForm({ ...EMPTY, ...p })
    setSkuTouched(true)
    setPhotoInfo(p.photo ? { bytes: Math.round(p.photo.length * 0.75) } : null)
    setFormError({})
    setEditing(p.id)
  }

  const closeForm = () => { setEditing(null); setPhotoBusy(false) }

  const set = (key, value) => setForm(f => {
    const next = { ...f, [key]: value }
    if (key === 'category') {
      /*  A subcategory belongs to exactly one range, so it cannot
          survive the range changing under it. */
      if (!getSubcategories(value).includes(next.subcategory)) next.subcategory = ''
      /*  Re-key the SKU too, unless the operator has taken it over. */
      if (!skuTouched) next.sku = nextSku(value)
    }
    if (key === 'sku') setSkuTouched(true)
    return next
  })

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    try {
      const { dataUrl, bytes, width, height } = await compressImage(file)
      setForm(f => ({ ...f, photo: dataUrl }))
      setPhotoInfo({ bytes, width, height, from: file.size })
    } catch (err) {
      toast(err.message || 'That image could not be read.', 'bad')
    } finally {
      setPhotoBusy(false)
    }
  }

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'A product needs a name.'
    if (!form.sku.trim()) errors.sku = 'A SKU is required — the live product page is addressed by it.'
    else if (isSkuTaken(form.sku, editing === 'new' ? null : editing)) {
      errors.sku = 'Another product already uses this SKU.'
    }
    setFormError(errors)
    return Object.keys(errors).length === 0
  }

  const onSave = (e) => {
    e?.preventDefault()
    if (!validate()) return
    const clean = {
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      alloy: form.alloy.trim(),
      finish: form.finish.trim(),
    }
    if (editing === 'new') {
      addProduct(clean)
      toast('Product added — publishing shortly.')
    } else {
      updateProduct(editing, clean)
      toast('Changes saved — publishing shortly.')
    }
    closeForm()
  }

  /* ── publishing ──────────────────────────────────────────────── */

  const onPublish = async () => {
    const ok = await publishToGitHub()
    if (ok) toast('Published to GitHub. The live site rebuilds in a minute or two.')
    else toast((SYNC[sync.status] || SYNC.error).hint, 'bad')
  }

  const saveToken = () => {
    setStoredToken(tokenInput)
    setSettingsOpen(false)
    toast(tokenInput.trim() ? 'Token saved. Publishing again…' : 'Token cleared.')
    if (tokenInput.trim()) publishToGitHub()
  }

  const signOut = () => {
    try { localStorage.removeItem(AUTH_KEY) } catch { /* private mode */ }
    setIsAuthed(false)
  }

  if (!isAuthed) {
    return (
      <AuthGate onUnlock={() => {
        try { localStorage.setItem(AUTH_KEY, 'true') } catch { /* private mode */ }
        setIsAuthed(true)
      }} />
    )
  }

  const categoryTitle = category === 'all' ? 'All products' : RANGES[category]?.name
  const showingAll = visible.length === counts[category]

  /* ── render ──────────────────────────────────────────────────── */

  return (
    <div className={s.root}>
      {/* ─── Top bar ─────────────────────────────────────────── */}
      <header className={s.topbar}>
        <button
          type="button"
          className={s.navToggle}
          onClick={() => setNavOpen(o => !o)}
          aria-label="Categories"
          aria-expanded={navOpen}
        >
          <span className={s.navToggleBars} aria-hidden="true" />
        </button>

        <a className={s.brand} href="/casa">
          <span className={s.brandMark}>C&amp;C</span>
          <span className={s.brandText}>Catalogue Admin</span>
        </a>

        <div className={s.search}>
          <Icon name="search" />
          <input
            ref={searchRef}
            className={s.searchInput}
            type="search"
            placeholder="Search products…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search products"
          />
          <kbd className={s.kbd}>⌘K</kbd>
        </div>

        <div className={s.topbarActions}>
          {/*  The label inside is hidden below 900px, which would take it
               out of the accessibility tree with it. An aria-label states
               the status once, at every width. */}
          <span
            className={s.status}
            data-tone={syncMeta.tone}
            title={sync.detail || syncMeta.hint}
            aria-label={`Publish status: ${syncMeta.label}`}
          >
            <i className={s.statusDot} aria-hidden="true" />
            <span className={s.statusLabel}>
              {syncMeta.label}
              {sync.status === 'synced' && sync.time ? ` · ${sync.time}` : ''}
            </span>
          </span>

          <button
            type="button"
            className={s.btnPrimary}
            data-attention={dirty ? '' : undefined}
            onClick={onPublish}
            disabled={sync.status === 'syncing'}
            title="Write the catalogue to GitHub now"
          >
            <Icon name="up" />
            <span className={s.btnLabel}>
              Publish{dirty && <span className={s.btnLabelLong}> changes</span>}
            </span>
          </button>

          <button type="button" className={s.iconBtn} onClick={() => { setTokenInput(getStoredToken()); setSettingsOpen(true) }} aria-label="Settings">
            <Icon name="cog" />
          </button>
          <button type="button" className={s.iconBtn} onClick={signOut} aria-label="Sign out">
            <Icon name="exit" />
          </button>
        </div>
      </header>

      <div className={s.shell}>
        {/* ─── Sidebar ───────────────────────────────────────── */}
        <aside className={s.sidebar} data-open={navOpen ? '' : undefined}>
          {/*  The drawer covers the top bar on a phone, so it carries its
               own dismiss rather than relying on the hamburger it hides. */}
          <div className={s.drawerHead}>
            <span className={s.drawerTitle}>Ranges</span>
            <button type="button" className={s.iconBtn} onClick={() => setNavOpen(false)} aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>

          <nav className={s.nav} aria-label="Categories">
            <p className={s.navHeading}>Ranges</p>
            {[['all', 'All products'], ...ORDER.map(slug => [slug, RANGES[slug].name])].map(([slug, label]) => (
              <button
                key={slug}
                type="button"
                className={s.navItem}
                data-active={category === slug ? '' : undefined}
                onClick={() => { setCategory(slug); setNavOpen(false) }}
              >
                <span className={s.navLabel}>{label}</span>
                <span className={s.navCount}>{counts[slug] ?? 0}</span>
              </button>
            ))}
          </nav>

          <div className={s.sidebarFoot}>
            <button type="button" className={s.btnGhost} data-block="" onClick={() => { setSubsOpen(true); setNavOpen(false) }}>
              <Icon name="tag" />
              <span>Manage subcategories</span>
            </button>

            <dl className={s.stats}>
              <div className={s.stat} data-warn={payloadBytes > PAYLOAD_WARN ? '' : undefined}>
                <dt>Catalogue size</dt>
                <dd>{formatBytes(payloadBytes)}</dd>
              </div>
              <div className={s.stat}>
                <dt>Products</dt>
                <dd>{products.length}</dd>
              </div>
              {missingSku > 0 && (
                <div className={s.stat} data-warn="">
                  <dt>Missing SKU</dt>
                  <dd>{missingSku}</dd>
                </div>
              )}
            </dl>

            {/*  Photos are base64-inlined into the one JSON file that a
                 publish sends, and that request is capped at 4.5MB. The
                 operator should see the ceiling coming rather than meet
                 it as a failed publish. */}
            {payloadBytes > PAYLOAD_WARN && (
              <div className={s.notice} data-tone="warn">
                <Icon name="warn" />
                <div>
                  <p className={s.noticeTitle}>Catalogue is getting large</p>
                  <p className={s.noticeBody}>
                    Publishing sends every photo in one request, which fails
                    past about 4.5&nbsp;MB. Replace the heaviest photos with
                    smaller crops, or move images out to files.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {navOpen && <button type="button" className={s.navScrim} onClick={() => setNavOpen(false)} aria-label="Close menu" />}

        {/* ─── Main ──────────────────────────────────────────── */}
        <main className={s.main}>
          {/* Mobile category strip */}
          <div className={s.chips}>
            {[['all', 'All'], ...ORDER.map(slug => [slug, RANGES[slug].name])].map(([slug, label]) => (
              <button
                key={slug}
                type="button"
                className={s.chip}
                data-active={category === slug ? '' : undefined}
                onClick={() => setCategory(slug)}
              >
                {label}
                <span className={s.chipCount}>{counts[slug] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className={s.toolbar}>
            <div className={s.toolbarTitle}>
              <h1 className={s.pageTitle}>{categoryTitle}</h1>
              <p className={s.pageMeta}>
                {visible.length} {visible.length === 1 ? 'product' : 'products'}
                {!showingAll && ` of ${counts[category] ?? 0}`}
                {query && ` matching “${query.trim()}”`}
              </p>
            </div>

            <div className={s.toolbarActions}>
              <label className={s.selectWrap}>
                <span className="sr-only">Sort by</span>
                <select className={s.select} value={sort} onChange={e => setSort(e.target.value)}>
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>

              <div className={s.viewToggle} role="group" aria-label="View">
                <button type="button" className={s.viewBtn} data-active={view === 'grid' ? '' : undefined}
                  onClick={() => setView('grid')} aria-label="Grid view"><Icon name="grid" /></button>
                <button type="button" className={s.viewBtn} data-active={view === 'list' ? '' : undefined}
                  onClick={() => setView('list')} aria-label="List view"><Icon name="list" /></button>
              </div>

              <button type="button" className={s.btnPrimary} onClick={openNew}>
                <Icon name="plus" />
                <span className={s.btnLabel}>Add product</span>
              </button>
            </div>
          </div>

          <section className={s.content} data-view={view}>
            {visible.length === 0 ? (
              query ? (
                <Empty
                  title="Nothing matches that search"
                  body={`No product in ${category === 'all' ? 'the catalogue' : RANGES[category]?.name} matches “${query.trim()}”.`}
                  action={<button type="button" className={s.btnGhost} onClick={() => setQuery('')}>Clear search</button>}
                />
              ) : (
                <Empty
                  title={category === 'all' ? 'The catalogue is empty' : `No products in ${RANGES[category]?.name} yet`}
                  body="Add a product and it will appear on the live range page once published."
                  action={<button type="button" className={s.btnPrimary} onClick={openNew}><Icon name="plus" /><span>Add product</span></button>}
                />
              )
            ) : (
              visible.map(p => (
                <article
                  key={p.id}
                  className={s.card}
                  tabIndex={0}
                  role="button"
                  onClick={() => openEdit(p)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit(p) } }}
                >
                  <div className={s.cardMedia}>
                    {p.photo
                      ? <img src={p.photo} alt="" className={s.cardImg} loading="lazy" />
                      : <span className={s.cardMediaEmpty}>{RANGES[p.category]?.name?.[0] || '—'}</span>}
                  </div>
                  <div className={s.cardBody}>
                    <h3 className={s.cardName}>{p.name || 'Untitled product'}</h3>
                    <p className={s.cardMeta}>
                      <span className={s.cardSku} data-missing={!p.sku ? '' : undefined}>
                        {p.sku || 'No SKU'}
                      </span>
                      <span className={s.cardDot} aria-hidden="true">·</span>
                      <span>{RANGES[p.category]?.name || p.category}</span>
                      {p.subcategory && <>
                        <span className={s.cardDot} aria-hidden="true">·</span>
                        <span>{p.subcategory}</span>
                      </>}
                    </p>
                    <p className={s.cardSpec}>
                      {[p.alloy, p.finish].filter(Boolean).join(' · ') || 'No material recorded'}
                    </p>
                  </div>
                  <div className={s.cardActions}>
                    {p.sku && (
                      <a
                        className={s.iconBtn}
                        href={`/product?sku=${encodeURIComponent(p.sku)}&r=${p.category}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        aria-label={`View ${p.name} on the site`}
                        title="View on the live site"
                      >
                        <Icon name="link" />
                      </a>
                    )}
                    <button
                      type="button"
                      className={s.iconBtn}
                      data-danger=""
                      onClick={e => { e.stopPropagation(); setConfirm({ kind: 'product', id: p.id, name: p.name }) }}
                      aria-label={`Delete ${p.name}`}
                      title="Delete"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </main>
      </div>

      {/* Mobile add button */}
      <button type="button" className={s.fab} onClick={openNew} aria-label="Add product">
        <Icon name="plus" />
        <span>Add product</span>
      </button>

      {/* ─── Product dialog ──────────────────────────────────── */}
      {editing && (
        <Dialog
          title={editing === 'new' ? 'Add product' : 'Edit product'}
          subtitle={editing === 'new'
            ? 'It goes live on the range page once published.'
            : form.sku}
          onClose={closeForm}
          footer={
            <div className={s.dialogActions}>
              {editing !== 'new' && (
                <button
                  type="button"
                  className={s.btnDanger}
                  onClick={() => setConfirm({ kind: 'product', id: editing, name: form.name })}
                >
                  <Icon name="trash" />
                  <span>Delete</span>
                </button>
              )}
              <button type="button" className={s.btnGhost} onClick={closeForm}>Cancel</button>
              <button type="button" className={s.btnPrimary} onClick={onSave} disabled={photoBusy}>
                <Icon name="check" />
                <span>{editing === 'new' ? 'Add product' : 'Save changes'}</span>
              </button>
            </div>
          }
        >
          <form className={s.form} onSubmit={onSave}>
            {/* Photo */}
            <div className={s.photoRow}>
              <button
                type="button"
                className={s.photoZone}
                onClick={() => fileRef.current?.click()}
                data-busy={photoBusy ? '' : undefined}
              >
                {form.photo
                  ? <img src={form.photo} alt="" className={s.photoImg} />
                  : <span className={s.photoPrompt}><Icon name="upload" /><span>Upload</span></span>}
                {photoBusy && <span className={s.photoBusy}>Processing…</span>}
              </button>

              <div className={s.photoSide}>
                <p className={s.photoTitle}>Product photo</p>
                <p className={s.photoNote}>
                  {photoInfo
                    ? `${photoInfo.width ? `${photoInfo.width}×${photoInfo.height} · ` : ''}${formatBytes(photoInfo.bytes)}${photoInfo.from ? ` (from ${formatBytes(photoInfo.from)})` : ''}`
                    : 'Resized to 1400px and compressed automatically — photos are stored inside the published catalogue file.'}
                </p>
                <div className={s.photoBtns}>
                  <button type="button" className={s.btnGhost} onClick={() => fileRef.current?.click()} disabled={photoBusy}>
                    <Icon name="upload" />
                    <span>{form.photo ? 'Replace' : 'Choose image'}</span>
                  </button>
                  {form.photo && (
                    <button type="button" className={s.btnGhost} data-danger="" onClick={() => { setForm(f => ({ ...f, photo: '' })); setPhotoInfo(null) }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className={s.fileInput} tabIndex={-1} />
            </div>

            <Field
              label="Product name" required
              value={form.name}
              onChange={v => { set('name', v); setFormError(e => ({ ...e, name: undefined })) }}
              placeholder="Brass Cremation Urn"
              error={formError.name}
            />

            <div className={s.grid2}>
              <label className={s.field}>
                <span className={s.label}>Range<em className={s.req} aria-hidden="true">*</em></span>
                <select className={s.select} value={form.category} onChange={e => set('category', e.target.value)}>
                  {ORDER.map(slug => <option key={slug} value={slug}>{RANGES[slug].name}</option>)}
                </select>
              </label>

              <label className={s.field}>
                <span className={s.label}>Subcategory</span>
                <select className={s.select} value={form.subcategory} onChange={e => set('subcategory', e.target.value)}>
                  <option value="">No subcategory</option>
                  {subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
                <span className={s.hint}>Filters the product on the range page.</span>
              </label>
            </div>

            <Field
              label="SKU" required mono
              value={form.sku}
              onChange={v => { set('sku', v.toUpperCase()); setFormError(e => ({ ...e, sku: undefined })) }}
              placeholder={skuPrefix(form.category) + '001'}
              error={formError.sku}
              hint="The live product page is addressed by this code, so it must be unique."
            />

            <div className={s.grid2}>
              <Field label="Metal" value={form.alloy} onChange={v => set('alloy', v)}
                placeholder={RANGES[form.category]?.spec?.[0]?.[1]} />
              <Field label="Finish" value={form.finish} onChange={v => set('finish', v)}
                placeholder={RANGES[form.category]?.spec?.[1]?.[1]} />
            </div>

            <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
          </form>
        </Dialog>
      )}

      {/* ─── Subcategories dialog ────────────────────────────── */}
      {subsOpen && (
        <Dialog
          title="Subcategories"
          subtitle="These become the filter buttons on each range page."
          onClose={() => setSubsOpen(false)}
        >
          <div className={s.form}>
            <label className={s.field}>
              <span className={s.label}>Range</span>
              <select className={s.select} value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                {ORDER.map(slug => <option key={slug} value={slug}>{RANGES[slug].name}</option>)}
              </select>
            </label>

            <label className={s.field}>
              <span className={s.label}>Add a subcategory</span>
              <div className={s.inlineRow}>
                <input
                  className={s.input}
                  type="text"
                  placeholder="Wall Sconces"
                  value={subInput}
                  onChange={e => setSubInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key !== 'Enter') return
                    e.preventDefault()
                    const clean = subInput.trim()
                    if (!clean) return
                    if (addSubcategory(subCategory, clean)) { setSubInput(''); toast(`Added “${clean}”.`) }
                    else toast('That subcategory already exists here.', 'warn')
                  }}
                />
                <button
                  type="button"
                  className={s.btnPrimary}
                  onClick={() => {
                    const clean = subInput.trim()
                    if (!clean) return
                    if (addSubcategory(subCategory, clean)) { setSubInput(''); toast(`Added “${clean}”.`) }
                    else toast('That subcategory already exists here.', 'warn')
                  }}
                >Add</button>
              </div>
            </label>

            <div className={s.field}>
              <span className={s.label}>In {RANGES[subCategory]?.name}</span>
              <div className={s.chipList}>
                {getSubcategories(subCategory).length === 0 && (
                  <p className={s.hint}>None yet — add one above.</p>
                )}
                {getSubcategories(subCategory).map(sub => {
                  const used = countProductsInSubcategory(subCategory, sub)
                  return (
                    <span className={s.tag} key={sub} data-custom={isCustomSubcategory(subCategory, sub) ? '' : undefined}>
                      <span className={s.tagName}>{sub}</span>
                      {used > 0 && <span className={s.tagCount}>{used}</span>}
                      <button
                        type="button"
                        className={s.tagDel}
                        onClick={() => setConfirm({ kind: 'subcategory', slug: subCategory, name: sub, used })}
                        aria-label={`Remove ${sub}`}
                      ><Icon name="close" /></button>
                    </span>
                  )
                })}
              </div>
              <span className={s.hint}>
                The number is how many products currently sit in that subcategory.
              </span>
            </div>
          </div>
        </Dialog>
      )}

      {/* ─── Settings dialog ─────────────────────────────────── */}
      {settingsOpen && (
        <Dialog
          title="Settings"
          subtitle="How this panel publishes to GitHub."
          onClose={() => setSettingsOpen(false)}
          footer={
            <div className={s.dialogActions}>
              <button type="button" className={s.btnGhost} onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button type="button" className={s.btnPrimary} onClick={saveToken}><Icon name="check" /><span>Save</span></button>
            </div>
          }
        >
          <div className={s.form}>
            <div className={s.notice} data-tone={syncMeta.tone}>
              <Icon name={syncMeta.tone === 'ok' ? 'check' : 'warn'} />
              <div>
                <p className={s.noticeTitle}>{syncMeta.label}</p>
                <p className={s.noticeBody}>{sync.detail || syncMeta.hint}</p>
              </div>
            </div>

            <div className={s.field}>
              <span className={s.label}>Publish route</span>
              <p className={s.hint}>
                The panel first tries <code>POST /api/publish</code>, which keeps the
                GitHub credential on the server where a visitor cannot read it. Set
                <code> GITHUB_TOKEN</code> in the hosting environment to use it.
                The token below is only a fallback for local development.
              </p>
            </div>

            <Field
              label="GitHub token (fallback)"
              mono
              type="password"
              value={tokenInput}
              onChange={setTokenInput}
              placeholder="github_pat_…"
              hint="Stored in this browser only. Needs the Contents: write permission on the catalogue repository."
            />

            <div className={s.notice} data-tone="warn">
              <Icon name="warn" />
              <div>
                <p className={s.noticeTitle}>Rotate any token that has been in the bundle</p>
                <p className={s.noticeBody}>
                  A token compiled into the site is readable by anyone who loads this
                  page. If one was ever shipped that way, revoke it on GitHub and
                  issue a fresh one.
                </p>
              </div>
            </div>

            <div className={s.field}>
              <span className={s.label}>Local copy</span>
              <p className={s.hint}>
                This browser keeps a working copy of the catalogue. It normally
                follows the published file, but is held back whenever there are
                edits that have not been published — so nothing is lost to a
                deploy. Discard it to take the published catalogue as it stands.
              </p>
              <div className={s.photoBtns}>
                <button
                  type="button"
                  className={s.btnGhost}
                  data-danger=""
                  onClick={() => setConfirm({ kind: 'reset' })}
                >
                  Discard local changes
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* ─── Confirm dialog ──────────────────────────────────── */}
      {confirm && (
        <Dialog
          title={
            confirm.kind === 'product' ? 'Delete this product?'
              : confirm.kind === 'reset' ? 'Discard local changes?'
              : 'Remove this subcategory?'
          }
          onClose={() => setConfirm(null)}
          size="compact"
          footer={
            <div className={s.dialogActions}>
              <button type="button" className={s.btnGhost} onClick={() => setConfirm(null)}>Cancel</button>
              <button
                type="button"
                className={s.btnDanger}
                data-solid=""
                onClick={() => {
                  if (confirm.kind === 'product') {
                    deleteProduct(confirm.id)
                    toast(`Deleted “${confirm.name || 'product'}”.`, 'warn')
                    if (editing === confirm.id) closeForm()
                  } else if (confirm.kind === 'reset') {
                    resetToPublished()
                    setDirty(false)
                    setSettingsOpen(false)
                    toast('Local copy reset to the published catalogue.', 'warn')
                  } else {
                    removeSubcategory(confirm.slug, confirm.name)
                    toast(`Removed “${confirm.name}”.`, 'warn')
                  }
                  setConfirm(null)
                }}
              >
                <Icon name="trash" />
                <span>{confirm.kind === 'reset' ? 'Discard' : 'Delete'}</span>
              </button>
            </div>
          }
        >
          <p className={s.confirmBody}>
            {confirm.kind === 'product'
              ? <>“{confirm.name || 'This product'}” will be removed from the catalogue and from the live site at the next publish. This cannot be undone.</>
              : confirm.kind === 'reset'
              ? <>Any edit in this browser that has not been published will be lost, and the catalogue will be reloaded from the published file. This cannot be undone.</>
              : <>“{confirm.name}” will stop appearing as a filter on the {RANGES[confirm.slug]?.name} page.</>}
          </p>
          {confirm.kind === 'subcategory' && confirm.used > 0 && (
            <div className={s.notice} data-tone="warn">
              <Icon name="warn" />
              <div>
                <p className={s.noticeTitle}>
                  {confirm.used} {confirm.used === 1 ? 'product is' : 'products are'} in this subcategory
                </p>
                <p className={s.noticeBody}>
                  They stay in the catalogue, but lose their filter label until you
                  assign them to another subcategory.
                </p>
              </div>
            </div>
          )}
        </Dialog>
      )}

      {/* ─── Toasts ──────────────────────────────────────────── */}
      <div className={s.toasts} role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={s.toast} data-tone={t.tone}>
            <Icon name={t.tone === 'bad' ? 'warn' : t.tone === 'warn' ? 'warn' : 'check'} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
