/*  ─────────────────────────────────────────────────────────────
    MOTION FALLBACK — the reveals and scrubs, for browsers without
    scroll-driven CSS

    THE PROBLEM THIS SOLVES
    Every reveal and every scrubbed effect on the site is authored as
    a CSS scroll-driven animation — `animation-timeline: view()` and
    `scroll(root block)`. That is the correct, compositor-cheap way to
    do it, and where it is supported nothing here needs to run. But it
    is NOT supported on iOS Safari before 26, on Firefox, or on older
    Android WebViews — which is a very large share of the phones this
    site is actually read on. There, the whole motion layer is inert:
    content is present (fail-open) but nothing reveals, nothing
    parallaxes, nothing catches the light. The page reads as static —
    the "very basic" mobile experience.

    So this file is the JavaScript understudy for exactly those
    engines. It mirrors the existing `data-reveal` / `data-scrub`
    vocabulary one-for-one, so NO markup changes: an element already
    choreographed for Chrome is choreographed here too.

    THREE GUARANTEES IT KEEPS
    · FAIL-OPEN. The hidden pose is applied by CSS gated on BOTH
      `@supports not (animation-timeline: view())` AND the `motion-js`
      class this file adds. If this script never runs, the class is
      never added and every element stays visible. A dependency
      failing means "content simply shows", exactly as before.
    · IT NEVER FIGHTS THE CSS SYSTEM. Where scroll timelines ARE
      supported this file detects that and does nothing at all — the
      class is not added, no observer is built, the CSS handles
      everything. The two systems are mutually exclusive by
      construction.
    · COMPOSITOR-ONLY, AND CHEAP. Reveals are one-shot Intersection
      Observer class toggles. Scrubs run in a single rAF-coalesced
      loop that only touches elements near the viewport and only
      writes transform/opacity — never a property that invalidates
      layout. On a settled page nothing runs.

    Priming (adding the class) happens as a SIDE EFFECT ON IMPORT,
    synchronously, before React renders the page's content into its
    empty root — so elements are born in their hidden pose and there
    is no flash of unrevealed content.
    ───────────────────────────────────────────────────────────── */

/*  One decision, made once. `view()` and `scroll()` shipped together,
    so testing the view timeline is sufficient to know both are
    available. Matching the exact @supports query the CSS uses means
    the two can never disagree about which regime is in force. */
function supportsScrollTimeline() {
  try {
    return (
      typeof CSS !== 'undefined' &&
      CSS.supports('animation-timeline: view()')
    )
  } catch {
    return false
  }
}

const NEEDS_FALLBACK =
  typeof document !== 'undefined' &&
  typeof window !== 'undefined' &&
  'IntersectionObserver' in window &&
  !supportsScrollTimeline() &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/*  PRIME. Synchronous, on import — this is the line that must beat
    the first paint. Adding it here rather than in a mount effect is
    what buys the no-flash: the class is on <html> before React
    commits the tree, so the hidden-pose rules match the elements the
    instant they exist. */
if (NEEDS_FALLBACK) {
  document.documentElement.classList.add('motion-js')
}

/*  Cover progress: 0 when the element's top edge touches the bottom
    of the viewport, 1 when its bottom edge leaves the top. The same
    0..1 the CSS `cover 0% cover 100%` range walks, so a JS scrub and
    a CSS scrub of the same element move identically. */
function coverProgress(rect, vh) {
  const p = (vh - rect.top) / (vh + rect.height)
  return p < 0 ? 0 : p > 1 ? 1 : p
}

/*  Exit progress for the masthead "sink": 0 while the element still
    holds the top of the viewport, ramping to 1 as it clears above.
    The 0.15 lead matches the CSS `exit 15%` start, so the title only
    begins to recede once it is genuinely being left behind. */
function exitProgress(rect) {
  const leaving = -rect.top / rect.height
  const e = (leaving - 0.15) / 0.85
  return e < 0 ? 0 : e > 1 ? 1 : e
}

export function initMotionFallback(root = document) {
  if (!NEEDS_FALLBACK) return () => {}

  /* ── Reveals — one-shot, on entry ──────────────────────────────
     Every `[data-reveal]` is watched once. When it crosses into view
     it gains `is-in`, the CSS transitions it from its hidden pose to
     natural, and it is released. The per-sibling `--i` already in the
     markup drives the transition-delay in CSS, so the stagger and the
     glyph-by-glyph assembly come along for free. */
  const revealTargets = root.querySelectorAll('[data-reveal]')
  let revealObserver = null

  if (revealTargets.length) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          revealObserver.unobserve(entry.target)
        }
      },
      /*  Reveal a little before the element is fully on screen, so
          type is already settling as it arrives rather than popping
          in after it has stopped. */
      { rootMargin: '0px 0px -22% 0px', threshold: 0.01 },
    )
    revealTargets.forEach((el) => revealObserver.observe(el))
  }

  /* ── Scrubs — continuous, position-coupled ─────────────────────
     Gathered once and sorted by kind. The document-scroll pair
     (the reading rail, the nav plate) read the scroll position
     directly; the view-relative kinds read each element's box. */
  const scrubEls = Array.from(root.querySelectorAll('[data-scrub]')).map(
    (el) => ({ el, kind: el.getAttribute('data-scrub') }),
  )

  const hasScrubs = scrubEls.length > 0
  let frame = 0
  let dirty = true

  const scrollingEl = document.scrollingElement || document.documentElement

  const paint = () => {
    frame = 0
    if (!dirty) return
    dirty = false

    const vh = window.innerHeight || document.documentElement.clientHeight
    const top = window.scrollY || scrollingEl.scrollTop || 0
    const max = (scrollingEl.scrollHeight || 0) - vh
    const docP = max > 0 ? top / max : 0

    /*  TWO PHASES, deliberately. If a rect were read straight after a
        transform were written, the engine would be forced to flush
        layout again to answer the read — one forced reflow per element
        per frame, the classic scroll-jank trap on a weak phone. So every
        box-kind rect is READ first, in one pass, while layout is clean;
        then every transform/opacity is WRITTEN, and since neither
        invalidates layout there is nothing left to flush. */
    const rects = scrubEls.map(({ el, kind }) =>
      kind === 'progress' || kind === 'navplate' ? null : el.getBoundingClientRect(),
    )

    scrubEls.forEach(({ el, kind }, i) => {
      /*  The document-coupled kinds want the scroll position, not a box. */
      if (kind === 'progress') {
        el.style.transform = `scaleX(${docP})`
        return
      }
      if (kind === 'navplate') {
        el.style.opacity = String(Math.min(top / (vh * 0.8), 1) * 0.96)
        return
      }

      const r = rects[i]
      /*  Nothing to do for a box well outside the viewport — skip the
          write entirely so a long page only pays to move what is near. */
      if (r.bottom < -vh || r.top > vh * 2) return

      if (kind === 'parallax') {
        const p = coverProgress(r, vh)
        el.style.transform = `translate3d(0, ${(p * 2 - 1) * 5}%, 0) scale(1.14)`
      } else if (kind === 'drift') {
        const p = coverProgress(r, vh)
        el.style.transform = `translate3d(0, ${(1 - p * 2) * 1.6}rem, 0)`
      } else if (kind === 'float') {
        const p = coverProgress(r, vh)
        el.style.transform = `translate3d(0, ${(p * 2 - 1) * 0.9}rem, 0)`
      } else if (kind === 'sink') {
        const e = exitProgress(r)
        el.style.transform = `translate3d(0, ${-10 * e}%, 0)`
        el.style.opacity = String(1 - 0.78 * e)
      }
    })
  }

  const request = () => {
    dirty = true
    if (!frame) frame = requestAnimationFrame(paint)
  }

  if (hasScrubs) {
    /*  Passive listeners — this loop never calls preventDefault, so
        it must never sit in the browser's scrolling critical path. */
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request, { passive: true })
    /*  Position everything correctly on arrival, before the first
        scroll: parallax layers, the rail, the nav plate. */
    request()
  }

  return () => {
    revealObserver?.disconnect()
    if (hasScrubs) {
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
      if (frame) cancelAnimationFrame(frame)
    }
  }
}
