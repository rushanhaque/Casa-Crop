/*  ─────────────────────────────────────────────────────────────
    POINTER PROXIMITY

    Writes the pointer's position within an element as --px and --py,
    normalised 0..1, so CSS can lean things toward the cursor.

    Three rules this obeys, each of which is where the naive version
    goes wrong:

    · One listener on the document, not one per element. Attaching to
      every magnetic element multiplies the same event.
    · Writes are batched into a single animation frame. A pointermove
      handler can fire far more often than the display refreshes, and
      writing a custom property on every event forces a style recalc
      each time — which is how a "cheap" micro-interaction becomes the
      reason a page drops frames.
    · It attaches at all only where it can be used: a device with a
      real pointer, and a visitor who has not asked for less motion.
      On a phone this file does nothing but return.
    ───────────────────────────────────────────────────────────── */

export function initPointer(root = document) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  const still = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (!fine.matches || still.matches) return () => {}

  const targets = Array.from(root.querySelectorAll('[data-pointer]'))
  if (targets.length === 0) return () => {}

  let frame = 0
  let pending = null

  const flush = () => {
    frame = 0
    if (!pending) return
    const { el, x, y } = pending
    pending = null
    el.style.setProperty('--px', x.toFixed(3))
    el.style.setProperty('--py', y.toFixed(3))
  }

  const onMove = (event) => {
    /*  Resolve which magnetic element is under the pointer via the
        event target rather than by testing each element's box —
        closest() walks a handful of ancestors, where hit-testing every
        target would be work proportional to how many there are. */
    const el = event.target.closest?.('[data-pointer]')
    if (!el) return

    const box = el.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return

    pending = {
      el,
      x: (event.clientX - box.left) / box.width,
      y: (event.clientY - box.top) / box.height,
    }

    if (!frame) frame = requestAnimationFrame(flush)
  }

  /*  Reset on leave so the element returns to centre rather than
      keeping whatever offset it held when the pointer left. */
  const onLeave = (event) => {
    const el = event.target.closest?.('[data-pointer]')
    if (!el) return
    el.style.setProperty('--px', '0.5')
    el.style.setProperty('--py', '0.5')
  }

  document.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerout', onLeave, { passive: true })

  return () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerout', onLeave)
    if (frame) cancelAnimationFrame(frame)
  }
}
