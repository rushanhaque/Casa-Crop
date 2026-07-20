/*  ─────────────────────────────────────────────────────────────
    COUNT-UP

    All visibility reveals moved to pure CSS scroll-driven animations
    in motion.css — fail-open, no observer, no hidden state. What
    remains here is the one behaviour CSS cannot express: ticking a
    figure up to its value the first time it is seen.

    The true figure is already in the markup, so a screen reader, a
    no-JS visitor, and anyone the observer misses all read the real
    number. This only ever animates a value that is already correct —
    which is also why every failure mode here is cosmetic.
    ───────────────────────────────────────────────────────────── */

function countUp(el) {
  const target = Number(el.dataset.count)
  if (!Number.isFinite(target)) return

  /*  Someone who asked for less motion gets the number, not the
      performance of the number. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const suffix = el.dataset.countSuffix || ''
  const plus = el.textContent.trim().endsWith('+') ? '+' : ''
  const duration = Number(el.dataset.countDuration) || 1600
  const start = performance.now()

  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1)
    // easeOutQuart: fast commitment, long settle.
    const eased = 1 - Math.pow(1 - t, 4)
    el.textContent = Math.round(target * eased).toLocaleString() + suffix + plus
    if (t < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

export function initReveal(root = document) {
  const targets = Array.from(root.querySelectorAll('[data-count]'))
  if (targets.length === 0 || typeof IntersectionObserver === 'undefined') {
    return () => {}
  }

  let remaining = targets.length

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        countUp(entry.target)
        observer.unobserve(entry.target)
        remaining -= 1
      }
      if (remaining === 0) observer.disconnect()
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  )

  const inView = (el) => {
    const r = el.getBoundingClientRect()
    return r.top < window.innerHeight && r.bottom > 0
  }

  targets.forEach((el) => {
    if (inView(el)) {
      countUp(el)
      remaining -= 1
      return
    }
    observer.observe(el)
  })

  if (remaining === 0) observer.disconnect()
  return () => observer.disconnect()
}
