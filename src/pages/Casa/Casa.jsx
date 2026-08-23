import { useEffect, useRef, useState } from 'react'
import Cart from '../../components/Cart/Cart'
import Collections from '../../components/Collections/Collections'
import Figure from '../../components/Figure/Figure'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Materials from '../../components/Materials/Materials'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { getProducts, subscribe } from '../../lib/products'
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

/*  The path a piece travels, set as a Cordes index — an index strung
    like an instrument. The rule beneath each station is a real
    string; the `gesture` rides beside the name in italic, the `tag`
    is the verb the station turns on. */
const JOURNEY = [
  { n: '01', label: 'Enquiry', gesture: 'the drawing arrives', tag: 'Enquire' },
  { n: '02', label: 'Design', gesture: 'your name on the title block', tag: 'Draw' },
  { n: '03', label: 'Sample', gesture: 'the first article', tag: 'Prove' },
  { n: '04', label: 'Forge', gesture: 'one boundary wall', tag: 'Cast' },
  { n: '05', label: 'Finish', gesture: 'measured, not described', tag: 'Finish' },
  { n: '06', label: 'Delivery', gesture: 'the report travels with it', tag: 'Ship' },
]

/**
 * One station of the Cordes index — a pluckable line, ported faithfully
 * from the maison-quinte Cordes collection.
 *
 * The rule beneath each station is a real string, and THE WORDS RIDE THE
 * WAVE: while a string rings, the text bobs a quarter of the string's own
 * centre displacement, then settles as it stills. The strings STRUM
 * THEMSELVES in a rising sequence as the section arrives — a scale
 * climbing the list — and afterwards sleep, the loop running only while a
 * line is actually moving.
 *
 * A fine pointer PULLS the line (drag away from it, release, and it rings
 * with the amplitude you gave it); a touch TAPS the row to pluck it.
 */
function Station({ step, index }) {
  const rowRef = useRef(null)
  const infoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const cnv = canvasRef.current
    const info = infoRef.current
    const row = rowRef.current
    if (!cnv || !info || !row) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)')
    const ctx = cnv.getContext('2d')
    const st = { w: 0, h: 0, dpr: 1, mode: 'idle', px: 0, pull: 0, A: 0, raf: 0, timer: 0 }

    const restY = () => st.h * 0.5

    /*  A half-sine pinned at both ends, swollen where the finger is —
        tension, not a wave drawn on a box. */
    const shape = (x, px, w) =>
      Math.sin((Math.PI * x) / w) *
      (0.35 + 0.65 * Math.exp(-((x - px) ** 2) / (2 * (w * 0.2) ** 2)))

    function draw(dispFn) {
      const { w, h } = st
      if (!w) return
      ctx.clearRect(0, 0, w, h)
      /*  Brass, where the reference is silver — the one warm thing on
          the page, poured at line scale. */
      ctx.strokeStyle = 'rgba(201, 177, 145, 0.75)'
      ctx.lineWidth = 1.3 * st.dpr
      ctx.beginPath()
      for (let i = 0; i <= 30; i += 1) {
        const x = (w * i) / 30
        const y = restY() + (dispFn ? dispFn(x) : 0)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    /*  Damped ring. Pitch rises with position in the list; the info
        rides the wave at a quarter amplitude, then returns to rest. */
    function ring() {
      const { w, px, A } = st
      const fv = 3 + index * 0.45
      const t0 = performance.now()
      cancelAnimationFrame(st.raf)
      st.mode = 'ring'
      const vib = (now) => {
        const t = (now - t0) / 1000
        const amp = A * Math.exp(-3.4 * t)
        if (Math.abs(amp) < 0.5) {
          st.mode = 'idle'
          draw(null)
          info.style.transform = ''
          return
        }
        const dispFn = (x) => amp * Math.cos(2 * Math.PI * fv * t) * shape(x, px, w)
        draw(dispFn)
        info.style.transform = `translateY(${((dispFn(w * 0.5) / st.dpr) * 0.25).toFixed(2)}px)`
        st.raf = requestAnimationFrame(vib)
      }
      st.raf = requestAnimationFrame(vib)
    }

    /*  A pluck at a fixed point — the touch tap and the arrival strum. */
    const pluck = (a, at) => {
      if (reduced.matches) return
      st.px = st.w * at
      st.A = a * st.dpr
      ring()
    }

    const size = () => {
      const r = cnv.getBoundingClientRect()
      if (!r.width) return
      st.dpr = Math.min(window.devicePixelRatio || 1, 2)
      st.w = cnv.width = Math.round(r.width * st.dpr)
      st.h = cnv.height = Math.round(r.height * st.dpr)
      draw(null)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(cnv)

    /*  Fine pointer: drag the line and release. */
    const onMove = (e) => {
      const r = cnv.getBoundingClientRect()
      st.px = (e.clientX - r.left) * st.dpr
      st.pull = Math.max(
        -16 * st.dpr,
        Math.min(16 * st.dpr, (e.clientY - r.top) * st.dpr - restY()),
      )
      if (st.mode !== 'drag') {
        cancelAnimationFrame(st.raf)
        st.mode = 'drag'
      }
      draw(
        (x) =>
          st.pull *
          Math.exp(-((x - st.px) ** 2) / (2 * (st.w * 0.16) ** 2)) *
          Math.sin((Math.PI * x) / st.w) *
          1.1,
      )
    }
    const onLeave = () => {
      if (st.mode === 'drag' && Math.abs(st.pull) > 2.5 * st.dpr) {
        st.A = st.pull
        if (reduced.matches) {
          st.mode = 'idle'
          draw(null)
        } else ring()
      } else {
        st.mode = 'idle'
        draw(null)
      }
    }
    /*  Touch: a tap anywhere on the row plucks it. */
    const onTap = () => pluck(12, 0.35)

    if (coarse.matches) {
      row.addEventListener('click', onTap)
    } else {
      cnv.addEventListener('pointermove', onMove, { passive: true })
      cnv.addEventListener('pointerleave', onLeave)
    }

    /*  The arrival strum: each string sounds itself as the row enters
        view, staggered down the list so the section rings in as a
        rising scale. IntersectionObserver, so it plays on every
        browser — including those without scroll-driven CSS. */
    let io = null
    if (!reduced.matches && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue
            st.timer = setTimeout(() => pluck(11, 0.25 + index * 0.12), 250 + index * 160)
            io.unobserve(en.target)
          }
        },
        { threshold: 0.4 },
      )
      io.observe(row)
    }

    return () => {
      cancelAnimationFrame(st.raf)
      clearTimeout(st.timer)
      ro.disconnect()
      io?.disconnect()
      row.removeEventListener('click', onTap)
      cnv.removeEventListener('pointermove', onMove)
      cnv.removeEventListener('pointerleave', onLeave)
    }
  }, [index])

  return (
    <li
      className={s.station}
      ref={rowRef}
      /*  Woven arrival — stations slide in from alternating edges. The
          section clips, so the off-position never reaches the page. */
      data-reveal={index % 2 === 0 ? 'slide-right' : 'slide-left'}
      style={{ '--i': index }}
    >
      <div className={s.stationInfo} ref={infoRef}>
        <span className={s.stationNum} aria-hidden="true">{step.n}</span>
        <h3 className={s.stationName}>
          {step.label} <i>{step.gesture}</i>
        </h3>
        <span className={s.stationTag} aria-hidden="true">{step.tag}</span>
      </div>
      <span className={s.stationString} aria-hidden="true">
        <canvas ref={canvasRef} />
      </span>
    </li>
  )
}

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

function BestSellers() {
  const [items, setItems] = useState(() => getProducts().filter(p => p.bestSeller))

  useEffect(() => subscribe(all => setItems(all.filter(p => p.bestSeller))), [])

  if (items.length === 0) return null

  return (
    <section className={s.bestSellers} aria-labelledby="bestsellers-title">
      <header className={s.head} data-reveal="slide-up">
        <Lines
          as="h2"
          className={s.sectionTitle}
          id="bestsellers-title"
          lines={['Best Sellers']}
          split="chars"
        />
      </header>
      <div className={s.bsTrack}>
        {items.map((p, i) => (
          <a
            key={p.id}
            className={s.bsCard}
            href={p.sku ? `/product?sku=${encodeURIComponent(p.sku)}&r=${p.category}` : '#'}
            data-reveal="rise"
            style={{ '--i': i }}
          >
            <div className={s.bsMedia}>
              {p.photo
                ? <img src={p.photo} alt={p.name} className={s.bsImg} loading="lazy" />
                : <span className={s.bsEmpty} aria-hidden="true" />}
              <span className={s.bsRake} aria-hidden="true" />
            </div>
            <div className={s.bsInfo}>
              <h3 className={s.bsName}>{p.name}</h3>
              {(p.alloy || p.finish) && (
                <p className={s.bsSpec}>{[p.alloy, p.finish].filter(Boolean).join(' · ')}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

/**
 * The Casa page — home metal products, manufactured and exported.
 *
 * The page alternates density and calm deliberately: a held hero, the
 * ranges, materials as a single wide gesture, one object held in
 * reference, then heritage and a closing statement. A page that runs
 * at one intensity throughout reads as loud rather than rich.
 *
 * The GROUND, by contrast, never varies: one flat jet black under
 * every section. It used to alternate black and beige, and the
 * alternation was doing the separating — which meant the page relied
 * on a change of material to mark a change of subject. It reads far
 * better with the rhythm carried by density alone: each plate is
 * distinguished by its lit top edge and shaded foot rather than by
 * being a different colour, and the only warm thing left on the page
 * is the brass.
 *
 * Every arrival is a different kind of arrival — display type rises
 * from behind its baseline, cards are uncovered, apparatus slides in
 * from its margin, rules draw themselves, figures tick up. One fade
 * doing every job is the clearest tell of generated work.
 */
/*  ── The landing sequence ─────────────────────────────────────────
    Six renders of ONE room from ONE camera, differing only in which
    lamps are lit. Stacked and cross-dissolved, the identical plates
    make light appear to BLOOM ON in place — the walls, ceiling and
    brass all take each source's warm bounce — so the landing reads as
    a slow film of the house waking, not a slideshow.

    Frame 1 is the room dark, every lamp off; it is the permanent base
    layer, so the room is never blank and the page opens on darkness.
    The five lit plates dissolve up over it in turn — the left lamps,
    the table globes, the floor lamp, the right pendant, and finally
    the chandelier in full — then the cycle travels on as one
    continuous glow. */
const HERO_BASE = 1
const HERO_SEQUENCE = [
  { n: 3, mobile: true },
  { n: 4, mobile: false },
  { n: 5, mobile: false },
  { n: 6, mobile: true },
  { n: 7, mobile: true },
  { n: 2, mobile: false },
]

function heroSources(n) {
  return {
    avif: `/hero/f${n}-900.avif 900w, /hero/f${n}-1600.avif 1600w`,
    webp: `/hero/f${n}-900.webp 900w, /hero/f${n}-1600.webp 1600w`,
    jpg: `/hero/f${n}-900.jpg 900w, /hero/f${n}-1600.jpg 1600w`,
    fallback: `/hero/f${n}-1600.jpg`,
  }
}

export default function Casa() {
  useReveal()

  /*  The landing loop is a continuous cross-dissolve of six full-bleed
      plates; there is no reason to keep the compositor busy once it is
      scrolled away. One observer parks the animation whenever the hero
      leaves the viewport and restarts it on return — the loop is paid
      for only while it is actually being watched. */
  const heroRef = useRef(null)
  useEffect(() => {
    const el = heroRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => el.toggleAttribute('data-paused', !entry.isIntersecting),
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <a className={s.skip} href="#ranges">
        Skip to ranges
      </a>

      <Nav current="Home" />
      <Progress />

      <main className={s.page}>
        {/*  The chapter rail — a fixed apparatus that knows which
            section is crossing the viewport with no script at all:
            each section declares a named view timeline, the names are
            hoisted to the page by timeline-scope, and each mark's
            brightness is scrubbed by its own chapter's passage.
            Difference-blended, so it inverts itself over the
            alternating grounds. Hidden where timelines are
            unsupported — an apparatus that cannot report is not shown
            reporting nothing. */}
        <nav className={s.rail} aria-label="Chapters">
          {[
            ['01', 'Collections', '#ranges', s.railItem1],
            ['02', 'Materials', '#materials', s.railItem2],
            ['03', 'Signature', '#signature', s.railItem3],
            ['04', 'Heritage', '#heritage', s.railItem4],
            ['05', 'Process', '#journey', s.railItem6],
            ['06', 'The house', '#house', s.railItem5],
          ].map(([index, label, href, cls]) => (
            <a className={`${s.railItem} ${cls}`} href={href} key={index}>
              <span className={s.railTick} aria-hidden="true" />
              <span className={s.railIndex}>{index}</span>
              <span className={s.srOnly}>{label}</span>
            </a>
          ))}
        </nav>

        {/* ── 1. Landing ─────────────────────────────────────── */}
        <section className={s.hero} aria-labelledby="hero-title" ref={heroRef}>
          {/*  The wrapper carries the entrance and the departure: where
              scroll timelines exist it swells slightly and dims as the
              hero exits, so leaving the landing reads as moving through
              the doorway rather than cropping a picture. Inside it, the
              stage holds the plates, which sit whole on the dark ground
              and only ever cross-dissolve — the whole apparatus stays
              on the compositor. */}
          <div className={s.heroArtWrap}>
            <div className={s.heroStage}>
              {/*  The base: the room with every lamp off. Never animated,
                  so there is always a plate beneath the dissolve and the
                  landing opens in darkness. */}
              {(() => {
                const src = heroSources(HERO_BASE)
                return (
                  <picture className={`${s.frame} ${s.frameBase}`}>
                    <source type="image/avif" srcSet={src.avif} sizes="100vw" />
                    <source type="image/webp" srcSet={src.webp} sizes="100vw" />
                    <img
                      className={s.frameImg}
                      src={src.fallback}
                      srcSet={src.jpg}
                      sizes="100vw"
                      alt=""
                      aria-hidden="true"
                      decoding="async"
                      fetchPriority="high"
                    />
                  </picture>
                )
              })()}

              {/*  The five lit plates, dissolving up over the base in
                  turn so the lamps appear to warm on around the room. */}
              {(() => {
                let mIndex = 0;
                return HERO_SEQUENCE.map((step, i) => {
                  const src = heroSources(step.n)
                  const currentMIndex = step.mobile ? mIndex++ : -1
                  return (
                    <picture 
                      className={`${s.frame} ${s.frameLit} ${!step.mobile ? s.frameDesktopOnly : ''}`} 
                      key={step.n} 
                      style={{ '--f-desktop': i, '--f-mobile': currentMIndex }}
                    >
                      <source type="image/avif" srcSet={src.avif} sizes="100vw" />
                      <source type="image/webp" srcSet={src.webp} sizes="100vw" />
                      <img
                        className={s.frameImg}
                        src={src.fallback}
                        srcSet={src.jpg}
                        sizes="100vw"
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        loading="eager"
                        fetchPriority={i === 0 ? 'high' : 'low'}
                      />
                    </picture>
                  )
                })
              })()}
            </div>
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

          {/*  The hint is now the line alone — the word "Scroll" is
              gone. A plumb line descending from the foot of a hero
              says the same thing without instructing anyone, and an
              instruction is a poor thing to put on the one screen
              that should only be a photograph.

              It does not loop — it DRAINS. Bound to the document's
              first few hundred pixels of scroll, it sinks and fades
              as its advice is taken, which is the only polite thing
              a scroll cue can do. */}
          <div className={s.scrollHint} aria-hidden="true">
            <span className={s.scrollHintLine} />
          </div>

          <h1 className={s.srOnly} id="hero-title">Casa — metal for the house</h1>
        </section>

        {/* ── 2. Ranges ──────────────────────────────────────── */}
        <section className={s.collections} id="ranges" aria-labelledby="ranges-title">
          <header className={s.head}>
            <Lines as="h2" className={s.sectionTitle} id="ranges-title" lines={['Collections']} split="chars" />
            <p className={s.standfirst} data-reveal="blur-in" style={{ '--i': 1 }}>
              Six programmes, tooled and held as running lines — turn a card for
              its specification.
            </p>
          </header>

          <Collections />
        </section>

        {/* ── 3. Materials ───────────────────────────────────── */}
        <section className={s.materials} id="materials" aria-labelledby="materials-title">
          <header className={s.head} data-reveal="slide-up">
            <Lines
              as="h2"
              className={s.sectionTitle}
              id="materials-title"
              lines={['What we work in']}
              split="chars"
            />
          </header>

          <Materials />
        </section>

        {/* ── 4. Signature ───────────────────────────────────── */}
        <section className={s.signature} id="signature" aria-labelledby="signature-title">
          <header className={s.head} data-reveal="flip-in">
            <Lines
              as="h2"
              className={s.sectionTitle}
              id="signature-title"
              lines={['Royal Glow Pendant Lantern']}
              split="chars"
              style={{ whiteSpace: 'nowrap', fontSize: 'clamp(1.2rem, 3.8vw, 4.4rem)' }}
            />
          </header>

          <div className={s.vitrine}>
            <span className={s.vitrineGhost} aria-hidden="true" data-scrub="float">
              №01
            </span>

            <div className={s.vitrineFrame} data-specular>
              <Figure
                src="/signature-lantern.jpg"
                ratio="4 / 5"
                className={s.vitrineArt}
                reveal={null}
              />
              <span className={s.vitrineRake} aria-hidden="true" />
            </div>

            <dl className={s.notes} data-scrub="drift">
              {[
                { key: 'Material', value: 'Brass & Glass' },
                { key: 'Finish', value: 'Brass Antique' },
              ].map((note, i) => (
                <div className={s.note} key={note.key} data-reveal="margin" style={{ '--i': i }}>
                  <span className={s.leader} aria-hidden="true" data-reveal="draw" style={{ '--i': i + 1 }}>
                    <i className={s.leaderDot} />
                  </span>
                  <dt className={s.noteKey}>{note.key}</dt>
                  <dd className={s.noteValue}>{note.value}</dd>
                </div>
              ))}

              <div className={s.noteAction} data-reveal="margin" style={{ '--i': 2 }}>
                <a href="/connect.html" className={s.enquireBtn}>
                  Enquire
                </a>
              </div>
            </dl>
          </div>
        </section>

        {/* ── 4b. Best sellers ────────────────────────────────── */}
        <BestSellers />

        {/* ── 5. Heritage ────────────────────────────────────── */}
        <section className={s.heritage} id="heritage" aria-labelledby="heritage-title">
          <video 
            className={s.heritageBg} 
            src="/HeritageBG.mp4" 
            autoPlay 
            muted 
            loop 
            playsInline 
            aria-hidden="true" 
          />
          <header className={s.head}>
            <Lines as="h2" className={s.sectionTitle} id="heritage-title" lines={['Heritage']} split="chars" />
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

        {/* ── Journey — the pluckable index ───────────────────── */}
        <section 
          className={s.journey} 
          id="journey" 
          aria-labelledby="journey-title"
          style={{ '--reveal-start': '2%', '--reveal-end': '25%', '--reveal-delay': '0ms' }}
        >
          <header className={s.journeyHead}>
            <span className={s.journeyEye} data-reveal="rise" style={{ '--i': 0 }}>Process</span>
            <Lines as="h2" className={s.sectionTitle} id="journey-title" lines={['The path a piece travels.']} split="chars" />
            <p className={s.journeyLede} data-reveal="rise" style={{ '--i': 1 }}>
              Every commission passes through the same six stations — no shortcuts, no
              exceptions. The rule beneath each is a real string; pull it, and it rings.
            </p>
          </header>

          <ol className={s.cordeList}>
            {JOURNEY.map((step, i) => (
              <Station step={step} index={i} key={step.n} />
            ))}
          </ol>
        </section>

        {/* ── 6. About ───────────────────────────────────────── */}
        <section className={s.about} id="house" aria-labelledby="about-title">
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

          <a className={s.cta} href="/connect.html" data-pointer data-magnetic data-reveal="rise" style={{ '--i': 5 }}>
            <span className={s.ctaLabel}>Request a sample set</span>
            <span className={s.ctaFill} aria-hidden="true" />
            {/*  The catch-light: once the fill has risen, a narrow band
                crosses the filled face — the button is metal too. */}
            <span className={s.ctaGlint} aria-hidden="true" />
            <span className={s.ctaRule} aria-hidden="true" />
          </a>
        </section>
      </main>

      <Footer />
      <Cart />
    </>
  )
}
