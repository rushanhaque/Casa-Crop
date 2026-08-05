import s from './Materials.module.css'
import { useDragScroll } from '../../lib/useDragScroll'

/*  Specifications are PLACEHOLDERS in the right shape. Swatches are
    indicative of the material, not a colour promise. */
const MATERIALS = [
  { name: 'Brass', swatch: '#B08D57' },
  { name: 'Copper', swatch: '#A9613F' },
  { name: 'Stainless Steel', swatch: '#9AA0A0' },
  { name: 'Aluminium', swatch: '#A8ABA6' },
  { name: 'Iron', swatch: '#5C5A57' },
  { name: 'Resin', swatch: '#D6C7A8' },
  { name: 'Wood', swatch: '#7A5637' },
  { name: 'Glass', swatch: '#A8B5B8' },
  { name: 'Ceramic', swatch: '#DDD5C6' },
  { name: 'Paper Mache', swatch: '#C2A878', ext: 'jpeg' },
]

function Specimen({ m, i, isEcho = false }) {
  return (
    <li
      className={`${s.alloy} ${isEcho ? s.echo : ''}`}
      style={{
        '--swatch': m.swatch,
        '--mat-img': `url('/Materials/${m.name.replace(/\s+/g, '')}.${m.ext || 'jpg'}')`,
        '--i': i,
      }}
      {...(isEcho ? { 'aria-hidden': 'true' } : {})}
    >
      <a
        className={s.swatchLink}
        href="/connect.html"
        tabIndex={isEcho ? -1 : undefined}
        aria-label={isEcho ? undefined : `Enquire now — ${m.name}`}
      >
        <span className={s.swatch} aria-hidden="true" />
        <span className={s.consultCta} aria-hidden="true">Enquire now</span>
      </a>
      <span className={s.body}>
        <span className={s.name}>{m.name}</span>
      </span>
    </li>
  )
}

/**
 * Materials — an endless row.
 *
 * The set is rendered TWICE and the track travels exactly one set's
 * width before repeating. Because the second set is identical to the
 * first, the frame at -50% is pixel-identical to the frame at 0, so
 * the loop closes with no jump and no seam. That is the whole trick;
 * everything else is bookkeeping.
 *
 * It is one transform on one element, so the motion is compositor-only
 * and never touches the main thread. The honest cost is that it never
 * stops: an infinite animation keeps a layer promoted for the life of
 * the page. Hence pausing whenever anyone is actually reading it —
 * which is also the usability fix, because a specification that slides
 * away mid-sentence is worse than no specification at all.
 *
 * The duplicate set is aria-hidden. Without that a screen reader would
 * announce ten materials twice, and the second pass would be
 * indistinguishable from a mistake.
 */
export default function Materials() {
  const scrollRef = useDragScroll()

  return (
    /*  data-scrub="drift": the whole band also drifts shallowly with
        the page's scroll, so the row travels on two axes at two
        rates — the marquee inside it, the page outside it — and the
        section reads in layers. The global `marquee` class lets the
        page transition pause the row while a navigation is running. */
    <div ref={scrollRef} className={s.shell} data-scrub="drift">
      <ul className={`${s.track} marquee`}>
        {MATERIALS.map((m, i) => (
          <Specimen m={m} i={i} key={m.name} />
        ))}
        {/*  The second pass. Purely visual — it exists so the loop has
            somewhere to travel to. */}
        {MATERIALS.map((m, i) => (
          <Specimen m={m} i={i} key={`echo-${m.name}`} isEcho />
        ))}
      </ul>
    </div>
  )
}
