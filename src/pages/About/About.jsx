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
  { value: 50, plus: true, label: 'Hands in the workshop' },
  { value: 10, plus: true, label: 'Years exporting' },
  { value: 34, plus: false, label: 'Countries served' },
  { value: 7, plus: false, label: 'Ranges in production' },
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
      <Nav current="About Us" />
      <Progress />

      <main className={s.page}>
        <section className={s.masthead} data-scrub="sink">
          <Lines
            as="h1"
            className={s.title}
            lines={['The house that', 'ships the house.']}
            enter
            enterDelay={160}
          />
          <p className={s.standfirst} data-enter="rise" style={{ '--enter-delay': '620ms' }}>
            Casa and Crop is a manufacturer and exporter of home metalware, working in
            brass, copper, steel and seven further materials from a single works in
            Moradabad — the city that has cast and beaten metal for export for three
            hundred years.
          </p>
        </section>

        <section className={s.figures} aria-label="The house in figures">
          <dl className={s.figureRow}>
            {FIGURES.map((f, i) => (
              <div className={s.figure} key={f.label} data-reveal="rise" style={{ '--i': i }}>
                <dd className={s.figureValue} data-count={f.value}>
                  {f.value}
                  {f.plus ? '+' : ''}
                </dd>
                <dt className={s.figureLabel}>{f.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section className={s.principles} aria-label="How the house works">
          {PRINCIPLES.map((p, i) => (
            <article className={s.principle} key={p.title} data-reveal="margin" style={{ '--i': i }}>
              <span className={s.principleIndex}>{String(i + 1).padStart(2, '0')}</span>
              <h2 className={s.principleTitle}>{p.title}</h2>
              <p className={s.principleBody}>{p.body}</p>
            </article>
          ))}
        </section>

        <section className={s.close}>
          {/*  The one serif moment per page — the pull-quote register the
              display face was retired into. */}
          {/*  The rule is set before the words — the page draws the
              line, then the voice speaks over it. */}
          <span className={s.quoteRule} aria-hidden="true" data-reveal="draw" />
          <blockquote className={s.quote} data-reveal="rise" style={{ '--i': 1 }}>
            <p>
              “We quote the tolerance, not the adjective.”
            </p>
          </blockquote>

          <a className={s.cta} href="/connect.html">
            <span className={s.ctaLabel}>Start an enquiry</span>
            <span className={s.ctaFill} aria-hidden="true" />
            <span className={s.ctaRule} aria-hidden="true" />
          </a>
        </section>
      </main>

      <Footer />
    </>
  )
}
