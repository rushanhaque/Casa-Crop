import { useEffect, useRef, useState } from 'react'
import {
  countItems,
  getItems,
  mailHref,
  removeItem,
  subscribe,
  whatsappHref,
} from '../../lib/cart'
import Corde from '../Corde/Corde'
import s from './Cart.module.css'

/**
 * The shortlist — a drawer of marked pieces, and the two ways to
 * send them.
 *
 * It is chrome, like the nav and the reading rail: every page mounts
 * it, it shows itself only when there is something in it, and it
 * costs a subscription to a module-level array when there is not.
 */
export default function Cart() {
  const [items, setItems] = useState(getItems)
  const [open, setOpen] = useState(false)
  const paneRef = useRef(null)
  const fabRef = useRef(null)

  useEffect(() => subscribe(setItems), [])

  const n = countItems(items)

  /*  A shortlist that empties while open should close itself rather
      than leave the buyer looking at a drawer of nothing. */
  useEffect(() => {
    if (n === 0) setOpen(false)
  }, [n])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      /*  Trap Tab inside the drawer while it is open — role=dialog +
          aria-modal promises the background is inert, so keyboard focus
          must not walk out into the page behind the scrim. */
      if (e.key !== 'Tab') return
      const pane = paneRef.current
      if (!pane) return
      const f = pane.querySelectorAll('a[href], button:not([disabled])')
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    /*  Lock the background the iOS-robust way — overflow:hidden alone
        is ignored by Safari's touch scrolling, so the page rubber-
        bands behind the drawer. Pin it with position:fixed and put the
        scroll back on close. */
    const scrollY = window.scrollY
    const body = document.body
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    document.addEventListener('keydown', onKey)
    /*  Move the reading position into the drawer, or a keyboard
        visitor opens it and then tabs through the page behind. */
    paneRef.current?.focus()
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
      document.removeEventListener('keydown', onKey)
      /*  Hand focus back to the case that opened the drawer. */
      fabRef.current?.focus()
    }
  }, [open])

  return (
    <>
      {/*  The case — a plain, recognisable shopping-cart mark. An
          earlier crate glyph was too cryptic to read as "your
          shortlist" at a glance; this is the one place on the site
          where legibility earns its keep over metaphor. */}
      <button
        className={s.fab}
        type="button"
        ref={fabRef}
        data-shown={n > 0 ? '' : undefined}
        onClick={() => setOpen(true)}
        aria-label={`Open the shortlist — ${n} ${n === 1 ? 'piece' : 'pieces'}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        tabIndex={n > 0 ? 0 : -1}
      >
        <svg className={s.fabMark} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className={s.fabCount}>{n}</span>
      </button>

      {/*  The scrim. Click-through to close, and it dims the page
          rather than blurring it — a backdrop filter here would read
          back the whole document every frame. */}
      <button
        className={s.scrim}
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-open={open ? '' : undefined}
        onClick={() => setOpen(false)}
      />

      <aside
        className={s.pane}
        data-open={open ? '' : undefined}
        inert={!open}
        role="dialog"
        aria-modal="true"
        aria-label="The shortlist"
        tabIndex={-1}
        ref={paneRef}
      >
        <header className={s.head}>
          <div>
            <span className={s.headKey}>Shortlist</span>
            <p className={s.headCount}>
              {n} {n === 1 ? 'piece' : 'pieces'} marked
            </p>
          </div>
          <button
            className={s.close}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close the shortlist"
          >
            <span className={s.closeBars} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </header>

        <ol className={s.list}>
          {items.map((it, i) => (
            <li className={s.row} key={it.sku} style={{ '--i': i }}>
              <div className={s.info}>
                <span className={s.name}>
                  {it.sku}
                  <i>{it.name}</i>
                </span>

                <span className={s.meta}>{it.range}</span>

                <button
                  className={s.strike}
                  type="button"
                  onClick={() => removeItem(it.sku)}
                  aria-label={`Remove ${it.sku} from the shortlist`}
                >
                  Remove
                </button>
              </div>

              <Corde index={i} className={s.string} />
            </li>
          ))}
        </ol>

        <footer className={s.foot}>
          <p className={s.footNote}>
            The list travels as a message — nothing is ordered here. Minimums, alloys
            and lead times are quoted per range.
          </p>

          <div className={s.actions}>
            <a
              className={`${s.action} ${s.actionWhats}`}
              href={whatsappHref(items)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={s.actionLabel}>Send on WhatsApp</span>
              <span className={s.actionFill} aria-hidden="true" />
            </a>
            <a className={s.action} href={mailHref(items)}>
              <span className={s.actionLabel}>Send by email</span>
              <span className={s.actionFill} aria-hidden="true" />
            </a>
          </div>
        </footer>
      </aside>
    </>
  )
}
