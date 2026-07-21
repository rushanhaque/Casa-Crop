import { useEffect, useRef, useState } from 'react'
import {
  countItems,
  getItems,
  mailHref,
  removeItem,
  setQty,
  subscribe,
  whatsappHref,
} from '../../lib/cart'
import s from './Cart.module.css'

/**
 * THE STRING — one per shortlist line.
 *
 * The rule beneath each entry is a real string: pull it and let go
 * and it rings at its own pitch, higher as you go down the list. It
 * is the one piece of canvas on the site, and it earns its place by
 * being honest about cost — the loop runs only while a string is
 * actually ringing and stops itself the moment the amplitude falls
 * under a fiftieth, so a settled shortlist costs nothing at all.
 *
 * Borrowed, with thanks, from the Cordes index — the pluckable list.
 */
function Corde({ index }) {
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

    /*  A half-sine along the whole span, swollen where the finger
        is: the string is pinned at both ends and pulled at one
        point, which is what makes the shape read as tension rather
        than as a wave drawn on a box. */
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

    /*  Damped ring. Pitch rises with position in the list, so a
        shortlist read top to bottom is a rising scale. */
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
      cnv.setPointerCapture?.(e.pointerId)
      const box = cnv.getBoundingClientRect()
      px = e.clientX - box.left
      pull = 0
      cancelAnimationFrame(raf)
      raf = 0
    }

    const onMove = (e) => {
      if (!cnv.hasPointerCapture?.(e.pointerId)) return
      const box = cnv.getBoundingClientRect()
      px = e.clientX - box.left
      /*  Clamped, or a determined drag turns the hairline into a
          tent pole. */
      pull = Math.max(-16, Math.min(16, e.clientY - box.top - h * 0.5))
      draw((x) => shape(x, px) * pull)
    }

    const onUp = (e) => {
      if (!cnv.hasPointerCapture?.(e.pointerId)) return
      cnv.releasePointerCapture?.(e.pointerId)
      if (Math.abs(pull) < 0.5) return
      ring(pull, px)
      pull = 0
    }

    size()
    /*  A line arriving in the list announces itself. */
    ring(9, w * 0.5)

    const ro = new ResizeObserver(size)
    ro.observe(cnv)
    cnv.addEventListener('pointerdown', onDown)
    cnv.addEventListener('pointermove', onMove)
    cnv.addEventListener('pointerup', onUp)
    cnv.addEventListener('pointercancel', onUp)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      cnv.removeEventListener('pointerdown', onDown)
      cnv.removeEventListener('pointermove', onMove)
      cnv.removeEventListener('pointerup', onUp)
      cnv.removeEventListener('pointercancel', onUp)
    }
  }, [index])

  return (
    <span className={s.string} aria-hidden="true">
      <canvas ref={ref} />
    </span>
  )
}

/**
 * The shortlist — a drawer of marked pieces, and the two ways to
 * send them.
 *
 * It is chrome, like the nav and the reading rail: every page mounts
 * it, it shows itself only when there is something in it, and it
 * costs a subscription to a module-level array when there is not.
 */
export default function Cart() {
  const [items, setItems] = useState(getItems)
  const [open, setOpen] = useState(false)
  const paneRef = useRef(null)

  useEffect(() => subscribe(setItems), [])

  const n = countItems(items)

  /*  A shortlist that empties while open should close itself rather
      than leave the buyer looking at a drawer of nothing. */
  useEffect(() => {
    if (n === 0) setOpen(false)
  }, [n])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    /*  Move the reading position into the drawer, or a keyboard
        visitor opens it and then tabs through the page behind. */
    paneRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      {/*  The case. Not a supermarket trolley — this house ships
          crates, and a crate is what a buyer is actually filling. */}
      <button
        className={s.fab}
        type="button"
        data-shown={n > 0 ? '' : undefined}
        onClick={() => setOpen(true)}
        aria-label={`Open the shortlist — ${n} ${n === 1 ? 'piece' : 'pieces'}`}
        aria-expanded={open}
        tabIndex={n > 0 ? 0 : -1}
      >
        <svg className={s.fabMark} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d="M3 7.5 12 12l9-4.5M12 12v9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
        <span className={s.fabCount}>{n}</span>
      </button>

      {/*  The scrim. Click-through to close, and it dims the page
          rather than blurring it — a backdrop filter here would read
          back the whole document every frame. */}
      <button
        className={s.scrim}
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-open={open ? '' : undefined}
        onClick={() => setOpen(false)}
      />

      <aside
        className={s.pane}
        data-open={open ? '' : undefined}
        inert={!open}
        aria-label="The shortlist"
        tabIndex={-1}
        ref={paneRef}
      >
        <header className={s.head}>
          <div>
            <span className={s.headKey}>Shortlist</span>
            <p className={s.headCount}>
              {n} {n === 1 ? 'piece' : 'pieces'} marked
            </p>
          </div>
          <button
            className={s.close}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close the shortlist"
          >
            <span className={s.closeBars} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </header>

        <ol className={s.list}>
          {items.map((it, i) => (
            <li className={s.row} key={it.sku} style={{ '--i': i }}>
              <div className={s.info}>
                <span className={s.name}>
                  {it.sku}
                  <i>{it.name}</i>
                </span>

                <span className={s.meta}>{it.range}</span>

                <span className={s.qty}>
                  <button
                    className={s.step}
                    type="button"
                    onClick={() => setQty(it.sku, it.qty - 1)}
                    aria-label={`Fewer of ${it.sku}`}
                  >
                    −
                  </button>
                  <span className={s.qtyValue}>{String(it.qty).padStart(2, '0')}</span>
                  <button
                    className={s.step}
                    type="button"
                    onClick={() => setQty(it.sku, it.qty + 1)}
                    aria-label={`More of ${it.sku}`}
                  >
                    +
                  </button>
                </span>

                <button
                  className={s.strike}
                  type="button"
                  onClick={() => removeItem(it.sku)}
                  aria-label={`Strike ${it.sku} from the shortlist`}
                >
                  Strike
                </button>
              </div>

              <Corde index={i} />
            </li>
          ))}
        </ol>

        <footer className={s.foot}>
          <p className={s.footNote}>
            The list travels as a message — nothing is ordered here. Minimums, alloys
            and lead times are quoted per range.
          </p>

          <div className={s.actions}>
            <a
              className={`${s.action} ${s.actionWhats}`}
              href={whatsappHref(items)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={s.actionLabel}>Send on WhatsApp</span>
              <span className={s.actionFill} aria-hidden="true" />
            </a>
            <a className={s.action} href={mailHref(items)}>
              <span className={s.actionLabel}>Send by email</span>
              <span className={s.actionFill} aria-hidden="true" />
            </a>
          </div>
        </footer>
      </aside>
    </>
  )
}
