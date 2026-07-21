import { useEffect, useState } from 'react'
import Cart from '../../components/Cart/Cart'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { addItem } from '../../lib/cart'
import { useReveal } from '../../lib/useReveal'
import s from './Range.module.css'

/*  DEMO DATA — the same sheet the range cards quote. One source of
    figures per range keeps the site cross-checkable: the MOQ a buyer
    reads on a card is the MOQ they find here. */
const RANGES = {
  funeral: {
    name: 'Funeral',
    meta: 'Cast · Spun',
    lede: 'Memorial and cremation ware in cast brass and copper — urns, plaques and keepsakes, finished by hand to an antique standard.',
    spec: [
      ['Alloy', 'Cast brass / copper'],
      ['Finish', 'Antique, hand-polished'],
      ['Minimum', '250 pcs / SKU'],
      ['Lead time', '45 days'],
    ],
  },
  lighting: {
    name: 'Lighting',
    meta: 'Spun · Plated',
    lede: 'Spun brass shades, bases and fittings, plated to a stated film thickness rather than to appearance alone.',
    spec: [
      ['Alloy', 'Spun brass, 1.2 mm'],
      ['Finish', 'Nickel / PVD, 12 µm'],
      ['Minimum', '250 pcs / SKU'],
      ['Lead time', '45 days'],
    ],
  },
  kitchenware: {
    name: 'Kitchenware',
    meta: 'Steel · Copper',
    lede: 'Serveware and cookware in 304 steel and ETP copper, mirror-finished and food-safe.',
    spec: [
      ['Alloy', '304 steel / ETP copper'],
      ['Finish', 'Mirror, food-safe'],
      ['Minimum', '250 pcs / SKU'],
      ['Lead time', '45 days'],
    ],
  },
  decor: {
    name: 'Décor',
    meta: 'Cast · Wrought',
    lede: 'Objects for the room — cast, wrought and waxed, in the antique register the house is known for.',
    spec: [
      ['Alloy', 'Gravity die cast brass'],
      ['Finish', 'Antique, waxed'],
      ['Minimum', '250 pcs / SKU'],
      ['Lead time', '45 days'],
    ],
  },
  accessories: {
    name: 'Accessories',
    meta: 'Brass · Zinc',
    lede: 'The small hardware of a finished house — hooks, handles, stays and stands in brass and zinc alloy.',
    spec: [
      ['Alloy', 'Brass, zinc alloy'],
      ['Finish', 'Plated, lacquered'],
      ['Minimum', '250 pcs / SKU'],
      ['Lead time', '45 days'],
    ],
  },
  furniture: {
    name: 'Furniture',
    meta: 'Tube · Inlay',
    lede: 'Frames and accent pieces in mild-steel tube with brass inlay, powder-coated to sixty microns.',
    spec: [
      ['Alloy', 'MS tube, brass inlay'],
      ['Finish', 'Powder coat, 60 µm'],
      ['Minimum', '250 pcs / SKU'],
      ['Lead time', '45 days'],
    ],
  },
  bathroom: {
    name: 'Bathroom',
    meta: 'Forged · Plated',
    lede: 'Forged fittings in CuZn39Pb3, chrome or PVD finished, machined to mating-face tolerance.',
    spec: [
      ['Alloy', 'CuZn39Pb3, forged'],
      ['Finish', 'Chrome / PVD'],
      ['Minimum', '250 pcs / SKU'],
      ['Lead time', '45 days'],
    ],
  },
}

const ORDER = ['funeral', 'lighting', 'kitchenware', 'decor', 'accessories', 'furniture', 'bathroom']

/*  Eight reserved plates per range. Products are added manually later;
    the plates are designed so the page is finished-looking while
    empty — a numbered pattern-plate awaiting its casting, not a
    broken image grid. */
const PLATE_COUNT = 8

export default function Range() {
  useReveal()

  const slug = new URLSearchParams(window.location.search).get('r')
  const known = slug && RANGES[slug]
  const range = known ? RANGES[slug] : RANGES[ORDER[0]]
  const activeSlug = known ? slug : ORDER[0]

  if (typeof document !== 'undefined') {
    document.title = `${range.name} — Casa and Crop`
  }

  const idx = ORDER.indexOf(activeSlug)

  return (
    <>
      <a className={s.skip} href="#content">
        Skip to content
      </a>

      <Nav current="Collections" />
      <Progress />

      <main className={s.page} id="content">
        <section className={s.masthead}>
          {/*  The range number, set enormous and ghosted behind the
              name — the pattern-book plate number as architecture. */}
          {/*  The plate number floats slower than the page — the
              tooling layer sits visibly behind the content layer. */}
          <span className={s.ghost} aria-hidden="true" data-scrub="float">
            {String(idx + 1).padStart(2, '0')}
          </span>

          <p className={s.crumb} data-enter="rise">
            <a className={s.crumbLink} href="/collections.html">
              Collections
            </a>
            <span aria-hidden="true"> — </span>
            <span>{range.meta}</span>
          </p>

          <Lines as="h1" className={s.title} lines={[range.name]} enter enterDelay={180} />

          <p className={s.lede} data-enter="rise" style={{ '--enter-delay': '600ms' }}>
            {range.lede}
          </p>

          {!known && slug ? (
            <p className={s.miss}>
              No range called “{slug}” — showing {range.name}.
            </p>
          ) : null}
        </section>

        <section className={s.plates} aria-label="Catalogue">
          {Array.from({ length: PLATE_COUNT }, (_, i) => (
            <Plate
              key={i}
              i={i}
              range={range}
              sku={`CC-${activeSlug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`}
            />
          ))}
        </section>
      </main>

      <Footer />
      <Cart />
    </>
  )
}

/**
 * One catalogue plate.
 *
 * A component of its own only because of the acknowledgement: the
 * button has to say it heard you, and that is a piece of state that
 * belongs to this plate and no other.
 */
function Plate({ i, range, sku }) {
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return undefined
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  const onAdd = () => {
    addItem({
      sku,
      name: range.name,
      range: range.meta,
      /*  The alloy and finish travel with the line, so the enquiry
          the buyer sends carries the specification they were looking
          at rather than a bare code. */
      spec: range.spec
        .filter(([k]) => k === 'Alloy' || k === 'Finish')
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · '),
    })
    setAdded(true)
  }

  return (
    <article className={s.plate} data-reveal="rise" style={{ '--i': i % 4 }}>
      <span className={s.plateGhost} aria-hidden="true" data-scrub="float">
        {String(i + 1).padStart(2, '0')}
      </span>
      <div className={s.plateWell}>
        {/*  The reserved image slot. Aspect is fixed so the grid
            cannot shift when photography lands. */}
        <div className={s.plateArt} />

        {/*  The pour, held back to a sill. It used to flood half the
            well — a whole face of brass to carry three words, which
            buried the piece under its own call to action. Now it
            rises exactly as far as the line of type needs, and the
            tilted meniscus still reads because a shallow pour is
            where a tilt is most visible. */}
        <button className={s.add} type="button" onClick={onAdd} data-added={added ? '' : undefined}>
          <span className={s.addFill} aria-hidden="true" />
          <span className={s.addLabel}>{added ? 'Added to cart' : 'Add to cart'}</span>
        </button>
      </div>
      <div className={s.plateFoot}>
        <span className={s.plateSku}>{sku}</span>
        <span className={s.plateState}>Awaiting catalogue</span>
      </div>
    </article>
  )
}
