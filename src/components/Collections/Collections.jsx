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
    subcategories: ['Urns', 'Caskets', 'Memorials', 'Keepsakes'],
    imageBeforeHover: '/covers/FuneralSketch.png',
    imageAfterHover: '/covers/Funeral.png',
  },
  {
    index: '02',
    title: 'Lighting',
    meta: 'Spun · Plated',
    subcategories: ['Pendants', 'Chandeliers', 'Sconces', 'Table Lamps'],
    imageBeforeHover: '/covers/LightingSketch.png',
    imageAfterHover: '/covers/Lighting.png',
  },
  {
    index: '03',
    title: 'Décor',
    meta: 'Cast · Wrought',
    subcategories: ['Vases', 'Sculptures', 'Trays', 'Bookends'],
    imageBeforeHover: '/covers/DecorSketch.png',
    imageAfterHover: '/covers/Decor.png',
  },
  {
    index: '04',
    title: 'Kitchenware',
    meta: 'Steel · Copper',
    subcategories: ['Cookware', 'Utensils', 'Serveware', 'Cutlery'],
    imageBeforeHover: '/covers/KitchenWareSketch.jpg',
    imageAfterHover: '/covers/KitchenWare.jpg',
  },
  {
    index: '05',
    title: 'Accessories',
    meta: 'Brass · Zinc',
    subcategories: ['Hooks', 'Handles', 'Knobs', 'Hinges'],
    imageBeforeHover: '/covers/AccessoriesSketch.jpg',
    imageAfterHover: '/covers/Accessories.jpg',
  },
  {
    index: '06',
    title: 'Furniture',
    meta: 'Tube · Inlay',
    subcategories: ['Tables', 'Seating', 'Shelving', 'Mirrors'],
    imageBeforeHover: '/covers/FurnitureSketch.jpg',
    imageAfterHover: '/covers/Furniture.jpg',
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
        <li className={s.cell} key={item.index} data-cell={ci + 1} data-reveal="zoom" style={{ '--i': ci % 4 }}>
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
                      <span 
                        className={s.image} 
                        style={item.imageBeforeHover ? { backgroundImage: `url(${item.imageBeforeHover})` } : undefined}
                      />
                      <span className={s.cardGhost}>{item.index}</span>
                    </span>
                  </span>

                  <span className={s.faceBack}>
                    <span className={s.panel}>
                      <span 
                        className={s.imageSketch} 
                        style={item.imageAfterHover ? { backgroundImage: `url(${item.imageAfterHover})` } : undefined}
                      />
                      <span className={s.papers}>
                        <span className={s.papersIndex}>{item.index}</span>
                        <span className={s.papersName}>{item.title}</span>
                        <span className={s.papersMeta}>{item.meta}</span>
                        <span className={s.papersList}>
                          {item.subcategories.map((sub) => (
                            <span className={s.papersRow} key={sub}>
                              <span className={s.papersValue}>{sub}</span>
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
                name stays readable through the gesture. data-vt-title:
                while the card is addressed, this caption carries the
                view-transition-name the range masthead answers to, so
                committing to the card sends its name travelling into
                the next document's headline. */}
            <span className={s.info}>
              <span className={s.title} data-vt-title>{item.title}</span>
              <span className={s.meta}>{item.meta}</span>
            </span>

            {/*  The light that runs across the face when the card is
                addressed. A translated gradient band, not an animated
                background-position — background-position repaints the
                whole element every frame, a transform does not. */}
            <span className={s.gloss} aria-hidden="true" />

            {/*  The accessible and touch-visible copy of the reverse. */}
            <span className={s.specPlain}>
              {item.subcategories.map((sub) => (
                <span className={s.specRow} key={sub}>
                  <span className={s.specValue}>{sub}</span>
                </span>
              ))}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
