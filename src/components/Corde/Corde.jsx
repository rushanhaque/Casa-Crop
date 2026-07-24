import { useEffect, useRef } from 'react'
import s from './Corde.module.css'

/**
 * A pluckable string — the Cordes motif.
 *
 * The rule beneath an entry is a real string: pull it and let it go
 * and it rings at its own pitch, higher the further down the list it
 * sits. It is the only canvas on the site, and it earns its place by
 * being honest about cost — the ring loop runs ONLY while a string is
 * actually vibrating and stops itself the moment the amplitude falls
 * under a fiftieth, so a settled list costs nothing at all.
 *
 * Two ways to sound it, one per input class:
 *   · A fine pointer PULLS — press, drag away from the line, release,
 *     and it rings with the amplitude you gave it.
 *   · A touch (or a plain click) TAPS — a quick, near-stationary press
 *     rings it at a fixed amplitude where the finger landed. This is
 *     deliberate: a vertical drag on a touchscreen belongs to the
 *     page's scroll, so the string never captures it and never fights
 *     the scroll — it answers the tap instead.
 *
 * The wrapper's box (position, height, cursor) is the caller's to
 * set through `className`; this component owns only the canvas and the
 * physics.
 *
 * @param {number} index  position in the list — raises the pitch
 * @param {string} className  positioning class for the strip wrapper
 */
export default function Corde({ index = 0, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const cnv = ref.current
    if (!cnv) return undefined

    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ctx = cnv.getContext('2d')
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let px = 0
    let pull = 0
    let startX = 0
    let startY = 0
    let startT = 0
    let dragging = false

    const size = () => {
      const box = cnv.getBoundingClientRect()
      if (box.width === 0) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = box.width
      h = box.height
      cnv.width = Math.round(w * dpr)
      cnv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(null)
    }

    /*  A half-sine along the whole span, swollen where the finger is:
        the string is pinned at both ends and pulled at one point,
        which is what makes the shape read as tension rather than as a
        wave drawn on a box. */
    const shape = (x, at) =>
      Math.sin((Math.PI * x) / w) *
      (0.35 + 0.65 * Math.exp(-((x - at) ** 2) / (2 * (w * 0.2) ** 2)))

    function draw(disp) {
      if (w === 0) return
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(201, 177, 145, 0.75)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i <= 30; i++) {
        const x = (w * i) / 30
        const y = h * 0.5 + (disp ? disp(x) : 0)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    /*  Damped ring. Pitch rises with position in the list, so a list
        read top to bottom is a rising scale. */
    function ring(amp, at) {
      if (still.matches) {
        draw(null)
        return
      }
      const freq = 3.2 + index * 0.45
      const t0 = performance.now()
      cancelAnimationFrame(raf)
      const tick = (now) => {
        const t = (now - t0) / 1000
        const decay = Math.exp(-t * 2.6)
        if (decay < 0.02) {
          draw(null)
          raf = 0
          return
        }
        const a = amp * decay
        draw((x) => shape(x, at) * a * Math.cos(2 * Math.PI * freq * t))
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const onDown = (e) => {
      const box = cnv.getBoundingClientRect()
      px = e.clientX - box.left
      startX = e.clientX
      startY = e.clientY
      startT = performance.now()
      pull = 0
      dragging = false
      cancelAnimationFrame(raf)
      raf = 0
      /*  Only a real pointer gets captured for a drag-pull. A touch is
          left uncaptured so a vertical swipe scrolls the page; its
          pluck arrives as a tap on release. */
      if (e.pointerType !== 'touch') {
        cnv.setPointerCapture?.(e.pointerId)
        dragging = true
      }
    }

    const onMove = (e) => {
      if (!dragging || !cnv.hasPointerCapture?.(e.pointerId)) return
      const box = cnv.getBoundingClientRect()
      px = e.clientX - box.left
      /*  Clamped, or a determined drag turns the hairline into a tent
          pole. */
      pull = Math.max(-16, Math.min(16, e.clientY - box.top - h * 0.5))
      draw((x) => shape(x, px) * pull)
    }

    const onUp = (e) => {
      const dx = Math.abs(e.clientX - startX)
      const dy = Math.abs(e.clientY - startY)
      const dt = performance.now() - startT
      if (dragging) {
        cnv.releasePointerCapture?.(e.pointerId)
        dragging = false
        if (Math.abs(pull) >= 0.5) {
          ring(pull, px)
          pull = 0
          return
        }
      }
      /*  A tap — a quick, near-stationary press, from a click or a
          finger — rings it where it landed. */
      if (dx < 8 && dy < 8 && dt < 500) {
        ring(11, px)
      }
      pull = 0
    }

    const onCancel = () => {
      dragging = false
      pull = 0
    }

    size()
    /*  A line arriving announces itself. */
    ring(9, w * 0.5)

    const ro = new ResizeObserver(size)
    ro.observe(cnv)
    cnv.addEventListener('pointerdown', onDown)
    cnv.addEventListener('pointermove', onMove)
    cnv.addEventListener('pointerup', onUp)
    cnv.addEventListener('pointercancel', onCancel)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      cnv.removeEventListener('pointerdown', onDown)
      cnv.removeEventListener('pointermove', onMove)
      cnv.removeEventListener('pointerup', onUp)
      cnv.removeEventListener('pointercancel', onCancel)
    }
  }, [index])

  return (
    <span className={`${s.wrap} ${className}`} aria-hidden="true">
      <canvas ref={ref} />
    </span>
  )
}
