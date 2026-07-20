import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
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
      <Nav current="Collections" />
      <Progress />

      <main className={s.page}>
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

        <section className={s.specBar} aria-label="Specification">
          {range.spec.map(([k, v], i) => (
            <div className={s.specCell} key={k} data-reveal="rise" style={{ '--i': i }}>
              <span className={s.specKey}>{k}</span>
              <span className={s.specValue}>{v}</span>
            </div>
          ))}
        </section>

        <section className={s.plates} aria-label="Catalogue">
          {Array.from({ length: PLATE_COUNT }, (_, i) => (
            <article className={s.plate} key={i} data-reveal="rise" style={{ '--i': i % 4 }}>
              <span className={s.plateGhost} aria-hidden="true" data-scrub="float">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className={s.plateWell}>
                {/*  The reserved image slot. Aspect is fixed so the
                    grid cannot shift when photography lands. */}
                <div className={s.plateArt} />
                {/*  The pour: molten brass rises from the foot of the
                    well on hover, its surface line carrying the same
                    tilt as every edge on the site, with the enquiry
                    cue riding the meniscus. The footer pours letters;
                    the plates pour their wells — one foundry gesture,
                    two scales. */}
                <span className={s.platePour} aria-hidden="true">
                  <span className={s.pourCue}>Enquire this piece</span>
                </span>
              </div>
              <div className={s.plateFoot}>
                <span className={s.plateSku}>
                  CC-{activeSlug.slice(0, 3).toUpperCase()}-{String(i + 1).padStart(3, '0')}
                </span>
                <span className={s.plateState}>Awaiting catalogue</span>
              </div>
            </article>
          ))}
        </section>

      </main>

      <Footer />
    </>
  )
}
