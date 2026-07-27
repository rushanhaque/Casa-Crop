import s from './Footer.module.css'
import { useEffect, useState, useRef } from 'react'

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Collections', href: '/collections.html' },
  { label: 'About Us', href: '/about.html' },
  { label: 'Contact', href: '/connect.html' },
  { label: 'The Threshold', href: '/' },
]

const RANGES = [
  ['Funeral', 'funeral'],
  ['Lighting', 'lighting'],
  ['Kitchenware', 'kitchenware'],
  ['Décor', 'decor'],
  ['Accessories', 'accessories'],
  ['Furniture', 'furniture'],
]

/*  The brand line, split for the pour. The space is preserved as a
    real space inside a span so the line wraps and reads correctly. */
const BRAND = 'Casa & Crop'

/**
 * The footer — and, since the header was cleared for rebuild, the
 * site's working navigation.
 *
 * THE POUR
 * The branding is set hollow — stroke only, like an empty mould — and
 * on hover molten brass rises up inside each letterform, staggered
 * along the line. For a house that casts metal this is not a hover
 * effect, it is the foundry described in one gesture.
 *
 * Mechanically it is the double-translate reveal: each letter carries
 * a filled copy inside a clipping window; the window's contents sit
 * one letter-height down, and on hover both layers translate in
 * opposition so the fill appears to rise INSIDE the glyph. Transform
 * and opacity only — nothing repaints, and the brass gradient itself
 * is static.
 *
 * The real text lives once, visually hidden; the letter spans are
 * aria-hidden decoration. A screen reader announces "Casa & Crop",
 * not eleven fragments.
 */
export default function Footer() {
  const [visible, setVisible] = useState(false)
  const brandRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
          } else {
            setVisible(false)
          }
        })
      },
      { threshold: 0.9, rootMargin: '0px 0px -40px 0px' }
    )
    if (brandRef.current) observer.observe(brandRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <footer className={s.footer}>
      {/*  The footer stands on the dark tone with the rest of the
          site — no flip. It separates from the page above by VALUE
          rather than by polarity: its plate is the deepest black on
          the site, so the document closes into the well, and the
          milled hairline on its tilted edge is what marks the join. */}
      {/*  Three bays, deliberately unequal — a nav list, a catalogue,
          and a place do not want the same measure. The two link
          columns are folio-numbered (01…), which turns a link stack
          into an index; the office is set as a record, not a
          paragraph. Each line reveals in reading order down its own
          column rather than the whole bay arriving as one slab. */}
      <div className={s.grid}>
        <nav className={s.col} aria-label="Site">
          <span className={s.key} data-reveal="rise" style={{ '--i': 0 }}>
            Site
          </span>
          <ul className={s.list}>
            {NAV.map((item, i) => (
              <li key={item.label} data-reveal="rise" style={{ '--i': i + 1 }}>
                <a className={s.navLink} href={item.href}>
                  <span className={s.linkLabel}>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={s.col} aria-label="Ranges">
          <span className={s.key} data-reveal="rise" style={{ '--i': 0 }}>
            Ranges
          </span>
          <ul className={s.list}>
            {RANGES.map(([label, slug], i) => (
              <li key={slug} data-reveal="rise" style={{ '--i': i + 1 }}>
                <a className={s.navLink} href={`/range.html?r=${slug}`}>
                  <span className={s.linkLabel}>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={s.col}>
          <span className={s.key} data-reveal="rise" style={{ '--i': 0 }}>
            Export Office
          </span>

          {/*  A stacked datum, not a sentence: tight leading, the
              human locality line lifted to full ink, the postcode set
              in tabular figures like a stamped number. */}
          <address className={s.address} data-reveal="rise" style={{ '--i': 1 }}>
            <span className={s.addrStreet}>14 Peetal Nagri, Civil Lines</span>
            <span className={s.addrCity}>Moradabad, Uttar Pradesh</span>
            <span className={s.addrCode}>244001</span>
          </address>

          {/*  Contact set as a ledger: a sand key, then the machined
              value. Only these two links carry the outbound glyph and
              the underline — the reference lines above do not. */}
          <dl className={s.contact}>
            <div className={s.contactRow} data-reveal="rise" style={{ '--i': 2 }}>
              <dt className={s.contactKind}>Email</dt>
              <dd className={s.contactVal}>
                <a className={s.contactLink} href="mailto:connect@casaandcrop.com">
                  <span className={s.linkLabel}>connect@casaandcrop.com</span>
                  <span className={s.linkRule} aria-hidden="true" />
                </a>
              </dd>
            </div>
            <div className={s.contactRow} data-reveal="rise" style={{ '--i': 3 }}>
              <dt className={s.contactKind}>Tel</dt>
              <dd className={s.contactVal}>
                <a className={s.contactLink} href="tel:+917579239454">
                  <span className={s.linkLabel}>+91 75792 39454</span>
                  <span className={s.linkRule} aria-hidden="true" />
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ── The pour ─────────────────────────────────────────── */}
      <a className={s.brand} href="/" aria-label="Casa and Crop — home" data-reveal="zoom" ref={brandRef} data-visible={visible ? '' : undefined}>
        <span className={s.srOnly}>{BRAND}</span>
        <span className={s.brandLine} aria-hidden="true">
          {BRAND.split('').map((ch, i) => (
            <span className={s.letter} key={i} style={{ '--l': i }}>
              {/*  The hollow glyph — the empty mould. */}
              <span className={s.hollow}>{ch === ' ' ? ' ' : ch}</span>
              {/*  The clipping window and the brass that rises in it. */}
              <span className={s.pourMask}>
                <span className={s.pour}>{ch === ' ' ? ' ' : ch}</span>
              </span>
            </span>
          ))}
        </span>
      </a>
    </footer>
  )
}
