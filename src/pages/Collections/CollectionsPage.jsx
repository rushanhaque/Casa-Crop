import Cart from '../../components/Cart/Cart'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { useReveal } from '../../lib/useReveal'
import s from './CollectionsPage.module.css'

/*  DEMO DATA — the same fictional sheet the rest of the site quotes,
    ordered and numbered to MATCH THE RANGE PAGES, so the numeral a
    visitor walks past here is the numeral that greets them there.
    (The homepage cards number Décor 03; the range book numbers it 04.
    The book wins — a catalogue that disagrees with itself about its
    own plate numbers is worse than either numbering.) */
/*  Room numbering is architectural — Roman, cut into the wall. The
    catalogue numbers on the plaques stay arabic; a museum does
    exactly this (Room IV, cat. no. 04). */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

const EXHIBITS = [
  {
    slug: 'funeral',
    index: '01',
    name: 'Funeral',
    meta: 'Cast · Spun',
    lede: 'Memorial and cremation ware in cast brass and copper — urns, plaques and keepsakes, finished by hand to an antique standard.',
    spec: [
      ['Metal', 'Cast brass / copper'],
      ['Finish', 'Antique, hand-polished'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    slug: 'lighting',
    index: '02',
    name: 'Lighting',
    meta: 'Spun · Plated',
    lede: 'Spun brass shades, bases and fittings, plated to a stated film thickness rather than to appearance alone.',
    spec: [
      ['Metal', 'Spun brass, 1.2 mm'],
      ['Finish', 'Nickel / PVD, 12 µm'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    slug: 'kitchenware',
    index: '03',
    name: 'Kitchenware',
    meta: 'Steel · Copper',
    lede: 'Serveware and cookware in 304 steel and ETP copper, mirror-finished and food-safe.',
    spec: [
      ['Metal', '304 steel / ETP copper'],
      ['Finish', 'Mirror, food-safe'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    slug: 'decor',
    index: '04',
    name: 'Décor',
    meta: 'Cast · Wrought',
    lede: 'Objects for the room — cast, wrought and waxed, in the antique register the house is known for.',
    spec: [
      ['Metal', 'Gravity die cast brass'],
      ['Finish', 'Antique, waxed'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    slug: 'accessories',
    index: '05',
    name: 'Accessories',
    meta: 'Brass · Zinc',
    lede: 'The small hardware of a finished house — hooks, handles, stays and stands in brass and zinc alloy.',
    spec: [
      ['Metal', 'Brass, zinc alloy'],
      ['Finish', 'Plated, lacquered'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    slug: 'furniture',
    index: '06',
    name: 'Furniture',
    meta: 'Tube · Inlay',
    lede: 'Frames and accent pieces in mild-steel tube with brass inlay, powder-coated to sixty microns.',
    spec: [
      ['Metal', 'MS tube, brass inlay'],
      ['Finish', 'Powder coat, 60 µm'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
]

const getCover = (name) => {
  const map = {
    'Funeral': 'Funeral.png',
    'Lighting': 'Lighting.png',
    'Kitchenware': 'KitchenWare.jpg',
    'Décor': 'Decor.png',
    'Accessories': 'Accessories.jpg',
    'Furniture': 'Furniture.jpg'
  }
  return `/covers/${map[name]}`
}

/**
 * The Collections page — the pattern book hung as an exhibition.
 *
 * This page is deliberately NOT the homepage grid given a second
 * outing. It is the one page on the site that changes ground beneath
 * you: a dark entrance hall, then the corridor — pale gallery walls,
 * the site's single polarity flip — where the seven programmes hang
 * as exhibits and the page scrolls SIDEWAYS.
 *
 * THE CORRIDOR
 * A tall section pins a viewport-height room and pans a horizontal
 * track through it, scrubbed by the section's own named view
 * timeline. Every instrument in every room — the engraved numerals,
 * the raking light, the labels, the compass at the foot of the wall —
 * subscribes to that ONE timeline through its own range slice, so
 * the entire exhibition is conducted by the scrollbar and nothing
 * else. No listeners, no libraries; walking backwards rewinds the
 * gallery.
 *
 * Where scroll timelines are unsupported, or on narrow screens, or
 * under reduced motion, the corridor lies down: the same rooms stack
 * vertically and remain fully legible. The failure mode of the whole
 * page is "a well-set catalogue".
 */
export default function CollectionsPage() {
  useReveal()

  return (
    <>
      <a className={s.skip} href="#content">
        Skip to content
      </a>

      <Nav current="Collections" />
      <Progress />

      <main className={s.page} id="content">
        {/* ── The entrance hall ─────────────────────────────── */}
        <header className={s.hall} aria-labelledby="collections-title">
          <p className={s.hallKicker} data-enter="rise" style={{ '--enter-delay': '120ms' }}>
            The pattern book — six programmes
          </p>
          <Lines
            as="h1"
            id="collections-title"
            className={s.hallTitle}
            lines={['Collections']}
            enter
            enterDelay={220}
            split="chars"
          />
          <p className={s.hallStandfirst} data-enter="rise" style={{ '--enter-delay': '760ms' }}>
            Six running lines, tooled and held. Hung here as they are kept in the
            works — one to a wall, with the sheet that governs each beside it.
          </p>
          <p className={s.hallCredit} data-enter="rise" style={{ '--enter-delay': '1000ms' }}>
            Casa &amp; Crop — foundry collections, Moradabad
          </p>

          {/*  The walk hint. Horizontal, because the corridor is — and
              it drains as its advice is taken. */}
          <div className={s.hallHint} aria-hidden="true">
            <span className={s.hallHintLine} />
            <span className={s.hallHintLabel} data-enter="rise" style={{ '--enter-delay': '1400ms' }}>
              Walk the corridor
            </span>
            {/*  Narrow screens lay the corridor down and scroll it
                vertically, so the cue must point down, not along. */}
            <span
              className={s.hallHintLabelDown}
              data-enter="rise"
              style={{ '--enter-delay': '1400ms' }}
            >
              Walk down the corridor
            </span>
          </div>
        </header>

        {/* ── The corridor ──────────────────────────────────── */}
        <section className={s.gallery} aria-label="The six ranges, hung as exhibits">
          <div className={s.pin}>
            <ol className={s.track}>
              {EXHIBITS.map((ex, i) => (
                <li className={s.room} key={ex.slug} style={{ '--r': i }}>
                  {/*  The numeral is the architecture of the room —
                      incised into the wall behind the exhibit, and
                      drifting a shade slower than the walk. */}
                  <span className={s.roomGhost} aria-hidden="true">
                    {ROMAN[i]}
                  </span>

                  {/*  Gallery lighting: one raking pass per room as it
                      crosses the viewport. */}
                  <span className={s.roomRake} aria-hidden="true" />

                  <h2
                    className={s.roomTitle}
                    id={`room-${ex.slug}`}
                    data-reveal="slide-down"
                    style={{ '--i': 0 }}
                  >
                    {ex.name}
                  </h2>

                  <a
                    className={s.exhibit}
                    href={`/range.html?r=${ex.slug}`}
                    aria-labelledby={`room-${ex.slug}`}
                  >
                    {/*  The plinth. Photography lands in the well; until
                        then the well is presented as a prepared mount,
                        not a missing image. */}
                    <span className={s.plinth} data-reveal="blur-in" style={{ '--i': 1 }}>
                      <span className={s.plinthWell} style={{ backgroundImage: `url(${getCover(ex.name)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <span className={s.plinthLip} aria-hidden="true" />
                    </span>
                    {/*  On touch there is no hover lift, glint or
                        view-transition prime, so the mount reads as an
                        empty box. A persistent quiet caption names the
                        destination and marks the plinth as an entrance. */}
                    <span className={s.exhibitCue} aria-hidden="true">
                      View range →
                    </span>
                  </a>

                  {/*  The tombstone label — the museum's wall card,
                      set in the house's apparatus register. */}
                  <aside
                    className={s.plaque}
                    aria-label={`${ex.name} — specification`}
                    data-reveal="slide-up"
                    style={{ '--i': 2 }}
                  >
                    <span className={s.plaqueIndex}>
                      № {ex.index} — {ex.meta}
                    </span>
                    <p className={s.plaqueLede}>{ex.lede}</p>
                    <span className={s.plaqueNote}>
                      Pieces at the works — photography forthcoming.
                    </span>
                    <dl className={s.plaqueSpec}>
                      {ex.spec.map(([k, v]) => (
                        <div className={s.plaqueRow} key={k}>
                          <dt className={s.plaqueKey}>{k}</dt>
                          <dd className={s.plaqueValue}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </aside>
                </li>
              ))}
            </ol>

            {/*  The compass — the corridor's own instrument: a drawn
                line filling with the walk, and the room numerals
                brightening as their rooms arrive. Exists only while
                the corridor is horizontal. */}
            <div className={s.compass} aria-hidden="true">
              <span className={s.compassLine}>
                <i className={s.compassFill} />
              </span>
              <span className={s.compassIndex}>
                {EXHIBITS.map((ex, i) => (
                  <b className={s.compassNum} key={ex.slug} style={{ '--r': i }}>
                    {ex.index}
                  </b>
                ))}
              </span>
            </div>
          </div>
        </section>

        {/* ── The vault ─────────────────────────────────────── */}
        <section className={s.vault} aria-labelledby="vault-title">
          <Lines
            as="h2"
            id="vault-title"
            className={s.vaultTitle}
            lines={['Every range is', 'made to drawing.']}
          />
          <p className={s.vaultBody} data-reveal="rise" style={{ '--i': 2 }}>
            Each programme above has been produced to a buyer's own specification —
            minimums, alloys and lead times are stated per range, and the same figures
            are quoted on the enquiry desk.
          </p>
          <a className={s.cta} href="/connect.html" data-pointer data-magnetic data-reveal="rise" style={{ '--i': 3 }}>
            <span className={s.ctaLabel}>Open an enquiry</span>
            <span className={s.ctaFill} aria-hidden="true" />
            <span className={s.ctaRule} aria-hidden="true" />
          </a>
        </section>
      </main>

      <Footer />
      <Cart />
    </>
  )
}
