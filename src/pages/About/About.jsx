import Cart from '../../components/Cart/Cart'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { useReveal } from '../../lib/useReveal'
import s from './About.module.css'

/*  DEMO DATA — the same fictional sheet the rest of the site quotes:
    2014, Moradabad, 34 countries, the 45-day promise. Replace with the
    real house before launch. */
const FIGURES = [
  { value: 50, plus: true, label: 'Hands in the workshop', sub: 'Across casting, machining and finishing' },
  { value: 10, plus: true, label: 'Years exporting', sub: 'To 34 countries' },
  { value: 7, plus: false, label: 'Ranges in production', sub: 'Tooled and held as running lines' },
  { value: 10, plus: true, label: 'Materials worked', sub: 'Metal, resin, wood, glass, ceramic' },
]

const PRINCIPLES = [
  {
    title: 'One boundary wall',
    body: 'Casting, machining, plating and inspection are all ours. Nothing critical is subcontracted, which is the only reason a 45-day lead time is a promise rather than an estimate.',
  },
  {
    title: 'The report travels first',
    body: 'Every consignment leaves with its dimensional report and, on plated work, its salt-spray result — sent before they are asked for. If a batch misses, you hear it from us first.',
  },
  {
    title: 'Tooled, not traded',
    body: 'Most of what is sold as handcrafted metal is bought in, polished and photographed well. Ours is made here, to drawing, and a first article can prove it.',
  },
]

export default function About() {
  useReveal()

  return (
    <>
      <a className={s.skip} href="#content">
        Skip to content
      </a>

      <Nav current="About Us" />
      <Progress />

      <main className={s.page} id="content">
        <section className={s.masthead} data-scrub="sink">
          <span className={s.sectionKey} data-enter="line" style={{ '--enter-delay': '80ms' }}>
            Heritage
          </span>
          <Lines
            as="h1"
            className={s.title}
            lines={['The house that', 'ships the house.']}
            enter
            enterDelay={160}
            split="chars"
          />
          <p className={s.standfirst} data-enter="blur-in" style={{ '--enter-delay': '620ms' }}>
            Casa and Crop is a manufacturer and exporter of home metalware, working in
            brass, copper, steel and seven further materials from a single works in
            Moradabad — the city that has cast and beaten metal for export for three
            hundred years.
          </p>
        </section>

        <section className={s.principles} aria-label="How the house works">
          {PRINCIPLES.map((p, i) => (
            <article className={s.principle} key={p.title} data-reveal="slide-up" style={{ '--i': i }}>
              <span className={s.principleIndex}>{String(i + 1).padStart(2, '0')}</span>
              <h2 className={s.principleTitle}>{p.title}</h2>
              <p className={s.principleBody}>{p.body}</p>
            </article>
          ))}
        </section>

        <section className={s.close}>
          {/*  The engraving. A rose-engine guilloche plate — the
              pattern a banknote or a watch dial is cut with — turned
              a few degrees by the section's own passage, like a plate
              on a lathe being inched round by hand. Generated once at
              build time as strokes; the browser rasterises it once
              and only ever rotates the cached raster. */}
          <div className={s.rosette} aria-hidden="true" />

          {/*  The one serif moment per page — the pull-quote register the
              display face was retired into. */}
          {/*  The rule is set before the words — the page draws the
              line, then the voice speaks over it, and the drawn line
              takes one catch-light as it passes mid-viewport. */}
          <span className={s.quoteRule} aria-hidden="true" data-reveal="draw" data-glint />
          <blockquote className={s.quote}>
            {/*  Letterpress: each line pivots up from its left edge as
                if being locked into a chase — scrubbed, so backing up
                the page unsets the type again. */}
            <Lines
              as="p"
              lines={['“We quote the tolerance,', 'not the adjective.”']}
              variant="tilt"
              startIndex={1}
            />
          </blockquote>

          <a className={s.cta} href="/connect.html" data-pointer data-magnetic data-reveal="blur-in" style={{ '--i': 2 }}>
            <span className={s.ctaLabel}>Start an enquiry</span>
            <span className={s.ctaFill} aria-hidden="true" />
            <span className={s.ctaRule} aria-hidden="true" />
          </a>
        </section>

        <section className={s.figures} aria-label="The house in figures">
          <dl className={s.figureRow}>
            {FIGURES.map((f, i) => (
              <div className={s.figure} key={f.label} data-reveal="flip-in" style={{ '--i': i }}>
                <dt className={s.figureLabel}>{f.label}</dt>
                <dd className={s.figureValue} data-count={f.value}>
                  {f.value}
                  {f.plus ? '+' : ''}
                </dd>
                {f.sub && <dd className={s.figureSub}>{f.sub}</dd>}
              </div>
            ))}
          </dl>
        </section>
      </main>

      <Footer />
      <Cart />
    </>
  )
}
