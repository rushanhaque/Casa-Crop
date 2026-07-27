import { useEffect, useRef, useState } from 'react'
import s from './Nav.module.css'

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Collections', href: '/collections.html' },
  { label: 'About Us', href: '/about.html' },
  { label: 'Contact', href: '/connect.html' },
]

/**
 * The navigation — the letterhead, and on small screens a full-page
 * menu.
 *
 * THE ROLLER (wide screens)
 * Each link is two copies of its own label in a clipping slot — ink
 * above, brass below. Hover rolls the pair one line upward, so the
 * label is replaced by its brass self rising from beneath: the pour,
 * at link scale. Transform only, compositor only.
 *
 * THE PANEL (small screens)
 * The menu is a full composition, not a dropped list: monumental
 * folio-numbered links that rise from their own baseline in reading
 * order, the current page marked with a brass node, and the export
 * desk set beneath as a colophon — so the menu reads as a page of the
 * site rather than a utility. It is a real modal: focus moves into it,
 * is trapped while it is open, the background scroll is locked (the
 * iOS-robust way), and Escape or the toggle returns focus to where it
 * came from.
 */
export default function Nav({ current }) {
  const [open, setOpen] = useState(false)
  const navRef = useRef(null)
  const toggleRef = useRef(null)

  const isHome = current === 'Home'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) return undefined

    const onScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    if (!open) return undefined

    /*  Lock the background the iOS-robust way: overflow:hidden on body
        is ignored by Safari's touch scrolling, so the page is pinned
        with position:fixed and its scroll offset restored on close. */
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

    /*  Move the reading position into the menu, and keep it there —
        the whole header is the modal context while open, so Tab wraps
        within it rather than walking into the page behind the panel. */
    const focusables = () =>
      Array.from(
        navRef.current?.querySelectorAll('a[href], button:not([disabled])') || [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)

    const list = focusables()
    list[list.length - 1]?.focus() // the first panel link (source order: mark, toggle, …links)

    const firstPanelLink = navRef.current?.querySelector(`.${s.panelLink}`)
    firstPanelLink?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const f = focusables()
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

    document.addEventListener('keydown', onKey)

    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
      document.removeEventListener('keydown', onKey)
      /*  Return focus to the control that opened the menu. */
      toggleRef.current?.focus()
    }
  }, [open])

  return (
    <header 
      className={s.nav} 
      data-open={open ? '' : undefined} 
      data-home-top={isHome && !scrolled && !open ? '' : undefined}
      ref={navRef}
    >
      <span className={s.plate} aria-hidden="true" />

      <div className={s.inner}>
        <a className={s.mark} href="/" aria-label="Casa and Crop — threshold">
          Casa<span className={s.markAmp}>&amp;</span>Crop
        </a>

        <nav className={s.links} aria-label="Primary">
          <ul className={s.list}>
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  className={s.link}
                  href={link.href}
                  aria-current={current === link.label ? 'page' : undefined}
                >
                  <span className={s.slot} aria-hidden="true">
                    <span className={s.labelInk}>{link.label}</span>
                    <span className={s.labelBrass}>{link.label}</span>
                  </span>
                  <span className={s.srOnly}>{link.label}</span>
                  <span className={s.node} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          className={s.toggle}
          type="button"
          ref={toggleRef}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls="nav-panel"
        >
          <span className={s.toggleLabel}>{open ? 'Close' : 'Menu'}</span>
          <span className={s.toggleBars} aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </div>

      {/*  Kept mounted so it can transition out; inert (a real boolean —
          React treats "" as false) removes it from the tab order and
          the accessibility tree while closed. */}
      <div
        className={s.panel}
        id="nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
      >
        <div className={s.panelInner}>
          <ul className={s.panelList}>
            {LINKS.map((link, i) => (
              <li className={s.panelItem} key={link.label} style={{ '--i': i }}>
                <a
                  className={s.panelLink}
                  href={link.href}
                  aria-current={current === link.label ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className={s.panelIndex}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={s.panelLabel}>{link.label}</span>
                  <span className={s.panelNode} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>

          {/*  The colophon — the export desk set beneath the index, so
              the menu closes on the house's address rather than on the
              last link. */}
          <div className={s.panelDesk}>
            <span className={s.panelDeskKey}>Export desk</span>
            <a className={s.panelDeskLink} href="mailto:connect@casaandcrop.com">
              connect@casaandcrop.com
            </a>
            <p className={s.panelDeskLine}>Moradabad, Uttar Pradesh · India</p>
          </div>
        </div>
      </div>
    </header>
  )
}
