import { useEffect, useState } from 'react'
import s from './Nav.module.css'

const LINKS = [
  { label: 'Home', href: '/casa.html' },
  { label: 'Collections', href: '/collections.html' },
  { label: 'About Us', href: '/about.html' },
]

/**
 * The navigation — rebuilt from scratch.
 *
 * THE TILTED PLATE
 * The bar's ground is a plate whose bottom edge carries the site's
 * lean — the navbar is the only element on the page whose boundary is
 * the brand diagonal, which makes it read as the site's letterhead
 * rather than as a generic fixed bar. The plate is transparent over
 * the hero and takes its ground as the page scrolls, driven by the
 * document's scroll timeline: a function of position, not direction,
 * so it costs no script and never hides itself while being reached
 * for.
 *
 * THE ROLLER
 * Each link is two copies of its own label in a clipping slot — ink
 * above, brass below. Hover rolls the pair one line upward, so the
 * label is replaced by its brass self rising from beneath: the pour,
 * at link scale. Transform only, compositor only.
 *
 * The only JavaScript is the small-screen menu, which is genuine
 * state.
 */
export default function Nav({ current }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className={s.nav} data-open={open ? '' : undefined}>
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

        <a
          className={s.cta}
          href="/connect.html"
          aria-current={current === 'Connect' ? 'page' : undefined}
        >
          <span className={s.ctaLabel}>Connect</span>
          <span className={s.ctaFill} aria-hidden="true" />
        </a>

        <button
          className={s.toggle}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
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
      <div className={s.panel} id="nav-panel" inert={!open}>
        <ul className={s.panelList}>
          {[...LINKS, { label: 'Connect', href: '/connect.html' }].map((link, i) => (
            <li className={s.panelItem} key={link.label} style={{ '--i': i }}>
              <a className={s.panelLink} href={link.href} onClick={() => setOpen(false)}>
                <span className={s.panelIndex}>{String(i + 1).padStart(2, '0')}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
