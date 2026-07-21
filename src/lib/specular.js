/*  ─────────────────────────────────────────────────────────────
    HEAVY LIGHT — the lagged pointer specular

    On dark panels marked [data-specular], a large soft pool of warm
    light follows the pointer — with pronounced lag, like a brass
    work-lamp being dragged on a pivot. No tilt, no glare, no card
    rotation: only illumination that arrives late. The delay is the
    craft; light that snaps to the cursor is a flashlight, light
    that swings after it has mass.

    Mechanics:
    · The pool is one element per panel, painted once (a radial
      gradient), then only ever transformed — compositor-only.
    · One rAF loop for all panels, and it SLEEPS: when every pool
      has converged on its target the loop stops asking for frames,
      so a still pointer costs nothing.
    · The lerp factor is the dial. 0.2 feels like a game cursor;
      0.07 feels like weight.
    · Ships nothing on touch devices and under reduced motion.
    ───────────────────────────────────────────────────────────── */

const LAG = 0.07

export function initSpecular(root = document) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  const still = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (!fine.matches || still.matches) return () => {}

  const panels = Array.from(root.querySelectorAll('[data-specular]'))
  if (panels.length === 0) return () => {}

  const states = []
  let frame = 0

  const step = () => {
    frame = 0
    let moving = false
    for (const st of states) {
      if (!st.lit && st.settled) continue
      st.x += (st.tx - st.x) * LAG
      st.y += (st.ty - st.y) * LAG
      const dx = Math.abs(st.tx - st.x)
      const dy = Math.abs(st.ty - st.y)
      st.settled = dx < 0.1 && dy < 0.1
      if (!st.settled) moving = true
      st.pool.style.transform = `translate3d(${st.x}px, ${st.y}px, 0) translate(-50%, -50%)`
    }
    if (moving) frame = requestAnimationFrame(step)
  }

  const wake = () => {
    if (!frame) frame = requestAnimationFrame(step)
  }

  for (const panel of panels) {
    const pool = document.createElement('div')
    pool.className = 'specular'
    pool.setAttribute('aria-hidden', 'true')
    panel.appendChild(pool)

    const st = { pool, x: 0, y: 0, tx: 0, ty: 0, lit: false, settled: true }
    states.push(st)

    const onMove = (e) => {
      const box = panel.getBoundingClientRect()
      st.tx = e.clientX - box.left
      st.ty = e.clientY - box.top
      if (!st.lit) {
        /*  First contact: the light comes on where the hand is, then
            begins to trail it — it must not sail in from a corner. */
        st.x = st.tx
        st.y = st.ty
        st.lit = true
        pool.classList.add('is-lit')
      }
      st.settled = false
      wake()
    }

    const onLeave = () => {
      st.lit = false
      pool.classList.remove('is-lit')
    }

    panel.addEventListener('pointermove', onMove, { passive: true })
    panel.addEventListener('pointerleave', onLeave, { passive: true })

    st.cleanup = () => {
      panel.removeEventListener('pointermove', onMove)
      panel.removeEventListener('pointerleave', onLeave)
      pool.remove()
    }
  }

  return () => {
    states.forEach((st) => st.cleanup())
    if (frame) cancelAnimationFrame(frame)
  }
}
