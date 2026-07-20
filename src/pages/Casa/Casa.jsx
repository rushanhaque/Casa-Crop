import Collections from '../../components/Collections/Collections'
import Figure from '../../components/Figure/Figure'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Materials from '../../components/Materials/Materials'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { useReveal } from '../../lib/useReveal'
import s from './Casa.module.css'

/*  ─────────────────────────────────────────────────────────────
    CONTENT

    Every figure and specification below is a PLACEHOLDER. They are
    written in the right shape — the shape a buyer reads — but the
    values are invented and must be replaced before this is public.
    Fabricated capacities, certifications or trade figures on an
    export site are not a design detail; they are a claim.
    ───────────────────────────────────────────────────────────── */

/*  Capability figures, not a chronicle. Every value is a PLACEHOLDER
    in the right shape — a fabricated headcount or capacity on an
    export site is a claim a buyer will hold you to, not a design
    detail. `plus` renders the trailing +; the count animates only on
    quantities, never on a year. */
const STANDING = [
  { value: 50, plus: true, label: 'Hands in the workshop', note: 'Across casting, machining and finishing' },
  { value: 10, plus: true, label: 'Years exporting', note: 'To 34 countries' },
  { value: 7, plus: false, label: 'Ranges in production', note: 'Tooled and held as running lines' },
  { value: 10, plus: true, label: 'Materials worked', note: 'Metal, resin, wood, glass, ceramic' },
]

/**
 * The Casa page — home metal products, manufactured and exported.
 *
 * The page alternates density and calm deliberately: a held hero, the
 * ranges, materials as a single wide gesture, one object held in
 * reference, then heritage and a closing statement. A page that runs
 * at one intensity throughout reads as loud rather than rich.
 *
 * It alternates GROUND as well — black, beige, black, beige, black.
 * The black sections carry a slight relief (a lit top edge, a shaded
 * foot, a vignette); the beige ones stay flat, because light catching
 * an edge is only legible on a dark surface. Each section declares its
 * tone and the tokens inside it re-declare themselves, so no component
 * needs to know which ground it is standing on.
 *
 * Every arrival is a different kind of arrival — display type rises
 * from behind its baseline, cards are uncovered, apparatus slides in
 * from its margin, rules draw themselves, figures tick up. One fade
 * doing every job is the clearest tell of generated work.
 */
export default function Casa() {
  useReveal()

  return (
    <>
      <a className={s.skip} href="#ranges">
        Skip to ranges
      </a>

      <Nav current="Home" />
      <Progress />

      <main className={s.page}>
        {/* ── 1. Landing ─────────────────────────────────────── */}
        <section className={s.hero} aria-labelledby="hero-title">
          {/*  Two elements, deliberately. data-enter and data-scrub both
              set animation-*, so on one element the entrance name binds
              to the scroll timeline and the parallax never runs. The
              wrapper fades and settles; the child drifts. */}
          <div className={s.heroArtWrap} data-enter="ground">
            <div className={s.heroArt} data-scrub="parallax" />
          </div>

          {/*  The landing is the photograph and nothing else.

              An h1 still has to exist — a document with no level-one
              heading is unnavigable by screen reader and reads as
              untitled to a crawler — so it is present and visually
              hidden rather than deleted. */}
          {/*  A raking light crossing the photograph once as the page
              settles — the moment the wordmark sheen used to carry,
              handed to the image now the hero is wordless. A translated
              gradient band, playing once: transform only, so the
              photograph is never repainted. */}
          <div className={s.heroLight} aria-hidden="true" />

          <h1 className={s.srOnly}>Casa — metal for the house</h1>
        </section>

        {/* ── 2. Ranges ──────────────────────────────────────── */}
        <section className={s.collections} id="ranges" data-tone="black" aria-labelledby="ranges-title">
          <header className={s.head}>
            <Lines as="h2" className={s.sectionTitle} id="ranges-title" lines={['Collections']} />
            <p className={s.standfirst} data-reveal="rise" style={{ '--i': 1 }}>
              Seven programmes, tooled and held as running lines — turn a card for
              its specification.
            </p>
          </header>

          <Collections />
        </section>

        {/* ── 3. Materials ───────────────────────────────────── */}
        <section className={s.materials} id="materials" data-tone="beige" aria-labelledby="materials-title">
          <header className={s.head}>
            <Lines
              as="h2"
              className={s.sectionTitle}
              id="materials-title"
              lines={['What we work in']}
            />
          </header>

          <Materials />
        </section>

        {/* ── 4. Signature ───────────────────────────────────── */}
        <section className={s.signature} aria-labelledby="signature-title" data-tone="black">
          <header className={s.head}>
            <Lines
              as="h2"
              className={s.sectionTitle}
              id="signature-title"
              lines={['The Ferro 14', 'lever set']}
            />
          </header>

          <div className={s.vitrine}>
            {/*  The pattern-plate number, ghosted behind the object at
                architectural scale — the same apparatus the range pages
                carry, so the reference reads as one of the book. */}
            <span className={s.vitrineGhost} aria-hidden="true" data-scrub="float">
              №14
            </span>

            <div className={s.vitrineFrame}>
              <Figure ratio="4 / 5" className={s.vitrineArt} reveal={null} data-scrub="parallax" />
              {/*  The raking light the cards carry, at vitrine scale. */}
              <span className={s.vitrineRake} aria-hidden="true" />
            </div>

            {/*  The notes drift shallowly against the image's own
                parallax, so the two columns travel at different rates
                and the section reads in layers. */}
            <dl className={s.notes} data-scrub="drift">
              {[
                { key: 'Alloy', value: 'CuZn39Pb3, gravity die cast' },
                { key: 'Finish', value: 'Brushed, lacquered — 12 µm' },
                { key: 'Tolerance', value: '±0.05 mm on mating faces' },
                { key: 'Lead time', value: '45 days from approved sample' },
              ].map((note, i) => (
                <div className={s.note} key={note.key} data-reveal="margin" style={{ '--i': i }}>
                  {/*  The leader — the annotation line of a working
                      drawing, running from the note toward its subject
                      and drawing itself in as you reach it. */}
                  <span className={s.leader} aria-hidden="true" data-reveal="draw" style={{ '--i': i + 1 }}>
                    <i className={s.leaderDot} />
                  </span>
                  <dt className={s.noteKey}>{note.key}</dt>
                  <dd className={s.noteValue}>{note.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── 5. Heritage ────────────────────────────────────── */}
        <section className={s.heritage} id="heritage" data-tone="beige" aria-labelledby="heritage-title">
          <header className={s.head}>
            <Lines as="h2" className={s.sectionTitle} id="heritage-title" lines={['Heritage']} />
          </header>

          {/*  The true figure is in the markup and the tick only ever
              animates toward a number that is already correct — so a
              screen reader, a visitor without JavaScript, and anyone
              who scrolls past quickly all get the real value. */}
          <dl className={s.standing}>
            {STANDING.map((stat, i) => (
              <div className={s.stat} key={stat.label} data-reveal="rise" style={{ '--i': i }}>
                <dd className={s.statValue} data-count={stat.value}>
                  {stat.value}
                  {stat.plus ? '+' : ''}
                </dd>
                <dt className={s.statLabel}>{stat.label}</dt>
                <p className={s.statNote}>{stat.note}</p>
              </div>
            ))}
          </dl>
        </section>

        {/* ── 6. About ───────────────────────────────────────── */}
        <section className={s.about} aria-labelledby="about-title" data-tone="black">
          <Lines
            as="h2"
            className={s.statement}
            id="about-title"
            lines={['We quote the', 'tolerance, not', 'the adjective.']}
          />
          <div className={s.aboutBody}>
            <p data-reveal="rise" style={{ '--i': 3 }}>
              Most of what is sold as handcrafted metal is bought in, polished, and
              photographed well. Ours is cast, machined, plated and inspected inside one
              boundary wall — which is the only reason a 45-day lead time is a promise
              rather than an estimate, and why a first article can be reported against
              your drawing rather than described in a paragraph.
            </p>
            <p data-reveal="rise" style={{ '--i': 4 }}>
              We will send the dimensional report before you ask for it, and the
              salt-spray result with it. If a batch misses, you will hear it from us
              first — a habit that has cost us orders and kept us buyers.
            </p>
          </div>

          <a className={s.cta} href="/connect.html" data-pointer data-magnetic>
            <span className={s.ctaLabel}>Request a sample set</span>
            <span className={s.ctaFill} aria-hidden="true" />
            <span className={s.ctaRule} aria-hidden="true" />
          </a>
        </section>
      </main>

      <Footer />
    </>
  )
}
