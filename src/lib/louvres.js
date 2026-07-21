/*  ─────────────────────────────────────────────────────────────
    LOUVRES — the direction-aware cascade

    Each card is a stack of vertical slats that turn to show their
    reverse. What makes it read as a physical object rather than a
    flip effect is WHICH slat moves first: the turn begins at the slat
    the pointer actually crossed and travels outward from there, so
    the card answers the hand that reached for it.

    The reference this is based on split the card in half and ran the
    cascade left-to-right or right-to-left. That is cheaper but it is
    also coarser — enter at the far right and the sweep still starts
    at the right EDGE rather than under your cursor. Measuring the
    entry slat and radiating from it costs one extra calculation and
    is the whole difference between a sweep and a response.

    Delays are written once per interaction, never per frame. Seven
    style writes on pointerenter is nothing; seven per pointermove
    would be a style recalculation on every mouse movement.
    ───────────────────────────────────────────────────────────── */

const STEP_IN = 52 // ms between neighbouring slats, opening
const STEP_OUT = 38 // closing is quicker — a departure should not dawdle

export function initLouvres(root = document) {
  const cards = Array.from(root.querySelectorAll('[data-louvres]'))
  if (cards.length === 0) return () => {}

  const still = window.matchMedia('(prefers-reduced-motion: reduce)')

  const cleanups = []

  for (const card of cards) {
    const slats = Array.from(card.querySelectorAll('[data-slat]'))
    if (slats.length === 0) continue

    /**
     * Stagger outward from whichever slat the pointer crossed.
     * Without a pointer — a keyboard focus, or a synthetic event —
     * the cascade starts at the leading edge, which is the sensible
     * reading order rather than an arbitrary middle.
     */
    const cascadeFrom = (clientX, step) => {
      const box = card.getBoundingClientRect()
      const entry =
        typeof clientX === 'number' && box.width > 0
          ? Math.round(((clientX - box.left) / box.width) * (slats.length - 1))
          : 0

      for (let i = 0; i < slats.length; i++) {
        slats[i].style.transitionDelay = `${Math.abs(i - entry) * step}ms`
      }
    }

    /*  Hover PRIMES the page transition. The addressed card's title
        takes the view-transition-name the range page's masthead also
        carries — so if the visitor commits, the caption they were
        reading travels across the document swap and becomes the
        headline. Named at hover rather than statically: seven cards
        all named would each be lifted out of the page wipe; naming
        only the one under consideration keeps the departure clean. */
    const vtTitle = card.querySelector('[data-vt-title]')

    const open = (event) => {
      if (still.matches) return
      cascadeFrom(event?.clientX, STEP_IN)
      card.setAttribute('data-turned', '')
      vtTitle?.style.setProperty('view-transition-name', 'range-title')
    }

    const close = (event) => {
      cascadeFrom(event?.clientX, STEP_OUT)
      card.removeAttribute('data-turned')
      vtTitle?.style.removeProperty('view-transition-name')
    }

    /*  Focus opens it too, so the reverse is reachable without a
        pointer at all. focusin/out rather than focus/blur because the
        card is a link containing other content — these bubble. */
    card.addEventListener('pointerenter', open)
    card.addEventListener('pointerleave', close)
    card.addEventListener('focusin', open)
    card.addEventListener('focusout', close)

    cleanups.push(() => {
      card.removeEventListener('pointerenter', open)
      card.removeEventListener('pointerleave', close)
      card.removeEventListener('focusin', open)
      card.removeEventListener('focusout', close)
    })
  }

  return () => cleanups.forEach((fn) => fn())
}
