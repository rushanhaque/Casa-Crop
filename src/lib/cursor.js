/*  ─────────────────────────────────────────────────────────────
    CUSTOM CURSOR

    A warm dot that follows the pointer and scales up over
    interactive elements. Uses requestAnimationFrame for smooth
    tracking without forcing a style recalc on every pointermove.

    The cursor element is created here and injected into the body.
    If this module never runs, the default cursor remains and
    nothing is hidden — the `has-cursor` class gates the `cursor:
    none` rule in global.css.

    Gated behind hover + fine pointer + reduced motion, same as
    every other pointer interaction on the site.
    ───────────────────────────────────────────────────────────── */

const INTERACTIVE = 'a, button, [data-pointer], [data-louvres], input, select, textarea, .alloy'

export function initCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  const still = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (!fine.matches || still.matches) return () => {}

  const dot = document.createElement('div')
  dot.className = 'cursor'
  document.body.appendChild(dot)
  document.documentElement.classList.add('has-cursor')

  let x = 0
  let y = 0
  let frame = 0

  const move = () => {
    frame = 0
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
  }

  const onMove = (e) => {
    x = e.clientX
    y = e.clientY
    if (!frame) frame = requestAnimationFrame(move)
  }

  const onEnter = () => dot.classList.add('is-visible')
  const onLeave = () => dot.classList.remove('is-visible')

  const onOver = (e) => {
    if (e.target.closest?.(INTERACTIVE)) {
      dot.classList.add('is-active')
    }
  }

  const onOut = (e) => {
    if (e.target.closest?.(INTERACTIVE)) {
      dot.classList.remove('is-active')
    }
  }

  document.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerenter', onEnter)
  document.addEventListener('pointerleave', onLeave)
  document.addEventListener('pointerover', onOver, { passive: true })
  document.addEventListener('pointerout', onOut, { passive: true })

  return () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerenter', onEnter)
    document.removeEventListener('pointerleave', onLeave)
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('pointerout', onOut)
    if (frame) cancelAnimationFrame(frame)
    dot.remove()
    document.documentElement.classList.remove('has-cursor')
  }
}
