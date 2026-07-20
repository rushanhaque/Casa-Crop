import s from './Collections.module.css'

/*  Seven slats per card. Fine enough to read as louvres rather than
    panels, wide enough that the turned edges stay legible even in the
    narrowest span of the row. */
/*  Five, not seven.

    Seven slats × two faces × seven cards is 98 backface-hidden
    surfaces inside preserve-3d — the exact layer-explosion profile
    that empties texture memory on a low-end Android. Five brings it
    to 70, a 29% cut, with almost no perceptible change to the
    louvre read. */
const SLATS = 5

/*  DEMO DATA. Every alloy, film thickness, minimum and lead time
    below is invented for presentation and must be replaced with the
    real catalogue before this is public. They are internally
    consistent — the same MOQ and lead time appear on the enquiry page
    — so the site reads as one house rather than as seven unrelated
    fragments, but they are still fiction. */
const ITEMS = [
  {
    index: '01',
    title: 'Funeral',
    meta: 'Cast · Spun',
    spec: [
      ['Alloy', 'Cast brass / copper'],
      ['Finish', 'Antique, hand-polished'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    index: '02',
    title: 'Lighting',
    meta: 'Spun · Plated',
    spec: [
      ['Alloy', 'Spun brass, 1.2 mm'],
      ['Finish', 'Nickel / PVD, 12 µm'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    index: '03',
    title: 'Décor',
    meta: 'Cast · Wrought',
    spec: [
      ['Alloy', 'Gravity die cast brass'],
      ['Finish', 'Antique, waxed'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    index: '04',
    title: 'Kitchenware',
    meta: 'Steel · Copper',
    spec: [
      ['Alloy', '304 steel / ETP copper'],
      ['Finish', 'Mirror, food-safe'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    index: '05',
    title: 'Accessories',
    meta: 'Brass · Zinc',
    spec: [
      ['Alloy', 'Brass, zinc alloy'],
      ['Finish', 'Plated, lacquered'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    index: '06',
    title: 'Furniture',
    meta: 'Tube · Inlay',
    spec: [
      ['Alloy', 'MS tube, brass inlay'],
      ['Finish', 'Powder coat, 60 µm'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
  {
    index: '07',
    title: 'Bathroom',
    meta: 'Forged · Plated',
    spec: [
      ['Alloy', 'CuZn39Pb3, forged'],
      ['Finish', 'Chrome / PVD'],
      ['Minimum', '250 pcs / SKU'],
    ],
  },
]

/**
 * The Ranges — seven louvred cards, three across then four.
 *
 * Each card is a stack of seven slats. Closed, they compose one
 * continuous image; addressed, they turn in sequence from the slat the
 * pointer actually crossed, and show the specification on the reverse.
 *
 * The composition trick is that every face holds a panel as wide as the
 * whole card, shifted left by that slat's own index — so a slat is a
 * window onto its strip of one picture, not one of seven pictures. Turn
 * them and the same arithmetic gives seven strips of one spec sheet.
 *
 * The slat stack is aria-hidden and the specification is repeated once
 * as real content. That single decision solves three problems at once:
 * a screen reader is not read seven copies of the same heading, a touch
 * device that cannot hover still sees the spec, and the card still says
 * everything it needs to with no JavaScript at all.
 */
export default function Collections() {
  return (
    <ul className={s.grid}>
      {ITEMS.map((item, ci) => (
        <li className={s.cell} key={item.index} data-cell={ci + 1} style={{ '--i': ci % 4 }}>
          <a
            className={s.card}
            href={`/range.html?r=${item.title.toLowerCase().replace(/[^a-z]/g, '')}`}
            data-louvres
            style={{ '--n': SLATS }}
          >
            <span className={s.louvres} aria-hidden="true">
              {Array.from({ length: SLATS }, (_, i) => (
                <span className={s.slat} key={i} data-slat style={{ '--i': i }}>
                  <span className={s.faceFront}>
                    <span className={s.panel}>
                      {/*  Keeps the .image class the per-card tints are
                          set against, so those go on working. */}
                      <span className={s.image} />
                      {/*  The pattern-book numeral on the face itself,
                          ghosted — inside the panel, so the slats
                          window one numeral rather than five. */}
                      <span className={s.cardGhost}>{item.index}</span>
                    </span>
                  </span>

                  <span className={s.faceBack}>
                    <span className={s.panel}>
                      <span className={s.papers}>
                        <span className={s.papersIndex}>{item.index}</span>
                        <span className={s.papersName}>{item.title}</span>
                        <span className={s.papersMeta}>{item.meta}</span>
                        <span className={s.papersList}>
                          {item.spec.map(([k, v]) => (
                            <span className={s.papersRow} key={k}>
                              <span className={s.papersKey}>{k}</span>
                              <span className={s.papersValue}>{v}</span>
                            </span>
                          ))}
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              ))}
            </span>

            {/*  Sits above the slats and does not turn with them, so the
                name stays readable through the gesture. */}
            <span className={s.info}>
              <span className={s.title}>{item.title}</span>
              <span className={s.meta}>{item.meta}</span>
            </span>

            {/*  The light that runs across the face when the card is
                addressed. A translated gradient band, not an animated
                background-position — background-position repaints the
                whole element every frame, a transform does not. */}
            <span className={s.gloss} aria-hidden="true" />

            {/*  The accessible and touch-visible copy of the reverse. */}
            <span className={s.specPlain}>
              {item.spec.map(([k, v]) => (
                <span className={s.specRow} key={k}>
                  <span className={s.specKey}>{k}</span>
                  <span className={s.specValue}>{v}</span>
                </span>
              ))}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
