import s from './Footer.module.css'

const NAV = [
  { label: 'Home', href: '/casa.html' },
  { label: 'Collections', href: '/collections.html' },
  { label: 'About Us', href: '/about.html' },
  { label: 'Connect', href: '/connect.html' },
  { label: 'The Threshold', href: '/' },
]

const RANGES = [
  ['Funeral', 'funeral'],
  ['Lighting', 'lighting'],
  ['Kitchenware', 'kitchenware'],
  ['Décor', 'decor'],
  ['Accessories', 'accessories'],
  ['Furniture', 'furniture'],
  ['Bathroom', 'bathroom'],
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
  return (
    <footer className={s.footer} data-tone="beige">
      {/*  The tone flip: every token inside — ink, rules, brass — is
          re-declared by [data-tone='beige'], so the footer inverts
          without knowing a thing about it. */}
      <div className={s.grid}>
        <nav className={s.col} aria-label="Site" data-reveal="rise" style={{ '--i': 0 }}>
          <span className={s.key}>Site</span>
          <ul className={s.list}>
            {NAV.map((item) => (
              <li key={item.label}>
                <a className={s.link} href={item.href}>
                  <span className={s.linkLabel}>{item.label}</span>
                  <span className={s.linkRule} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={s.col} aria-label="Ranges" data-reveal="rise" style={{ '--i': 1 }}>
          <span className={s.key}>Ranges</span>
          <ul className={s.list}>
            {RANGES.map(([label, slug]) => (
              <li key={slug}>
                <a className={s.link} href={`/range.html?r=${slug}`}>
                  <span className={s.linkLabel}>{label}</span>
                  <span className={s.linkRule} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={s.col} data-reveal="rise" style={{ '--i': 2 }}>
          <span className={s.key}>Works &amp; Export Office</span>
          <p className={s.address}>
            14 Peetal Nagri, Civil Lines
            <br />
            Moradabad, Uttar Pradesh 244001
          </p>
          <ul className={s.list}>
            <li>
              <a className={s.link} href="mailto:export@casaandcrop.com">
                <span className={s.linkLabel}>export@casaandcrop.com</span>
                <span className={s.linkRule} aria-hidden="true" />
              </a>
            </li>
            <li>
              <a className={s.link} href="tel:+915912458890">
                <span className={s.linkLabel}>+91 591 245 8890</span>
                <span className={s.linkRule} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* ── The pour ─────────────────────────────────────────── */}
      <a className={s.brand} href="/" aria-label="Casa and Crop — home">
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
