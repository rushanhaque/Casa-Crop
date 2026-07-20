import Collections from '../../components/Collections/Collections'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { useReveal } from '../../lib/useReveal'
import s from './CollectionsPage.module.css'

/**
 * The collections index — the louvre grid given a whole page.
 *
 * The grid is the same component the homepage shows; a catalogue that
 * looked different from its shopfront would read as two sites.
 */
export default function CollectionsPage() {
  useReveal()

  return (
    <>
      <Nav current="Collections" />
      <Progress />

      <main className={s.page}>
        <section className={s.masthead} data-scrub="sink">
          <Lines as="h1" className={s.title} lines={['Collections']} enter enterDelay={160} />
          <p className={s.standfirst} data-enter="rise" style={{ '--enter-delay': '560ms' }}>
            Seven programmes, tooled and held as running lines. Turn a card for its
            specification; open it for the range.
          </p>
        </section>

        <section className={s.gridWrap} aria-label="The seven ranges">
          <Collections />
        </section>

        <p className={s.note} data-reveal="rise">
          Every range is available to specification, and each has been produced to a
          buyer's own drawing. Minimums, alloys and lead times are stated per range —
          and the same figures are quoted on the enquiry desk.
        </p>
      </main>

      <Footer />
    </>
  )
}
