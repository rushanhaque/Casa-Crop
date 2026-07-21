import s from './Threshold.module.css'

/**
 * The landing division: Casa at 60%, Crop at 40%, split by a tilted
 * seam.
 *
 * Entirely static — no state, no effects, no listeners, nothing that
 * moves. The component renders once and is then inert, which is why
 * this page costs essentially nothing to run on a slow device.
 *
 * Crop is held back deliberately: softened and shaded, since it
 * launches later and Casa is the focus.
 *
 * Background imagery is supplied per panel through the --art custom
 * property and is intentionally unset for now.
 */
export default function Threshold() {
  return (
    <div className={s.threshold}>
      {/* The page's real heading. The wordmarks below are display
          type; this is what a screen reader announces. */}
      <h1 className="sr-only">Casa and Crop</h1>

      {/*  Casa is the way in. The link fills the panel, and because the
          panel is clipped the clickable area is clipped with it — the
          whole visible side is the target, with nothing spilling over
          the seam into Crop. A real href, so it works without
          JavaScript and the browser can transition between documents
          itself. */}
      <section className={`${s.panel} ${s.casa}`} aria-labelledby="casa-mark">
        {/*  data-specular: the heavy light — a warm pool that trails
            the pointer across the dark ground, injected and driven by
            lib/specular.js on fine-pointer devices only. It lives on
            the clipped panel, so the light honours the seam. */}
        <div className={s.artWrap} data-enter="ground" data-specular>
          <div className={s.art} />
        </div>
        <a className={`${s.inner} ${s.entry}`} href="/casa.html">
          <span className={s.wordmarkMask}>
            {/*  Glyph-by-glyph: each letter pivots up from its own
                foot inside the shared mask. The label carries the
                word; the glyphs are decoration. */}
            <span className={s.wordmark} id="casa-mark" aria-label="Casa">
              {Array.from('Casa').map((ch, i) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  aria-hidden="true"
                  data-enter="char"
                  style={{ '--enter-delay': `${180 + i * 46}ms` }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </span>
          <span className={s.legend} data-enter="rise" style={{ '--enter-delay': '480ms' }}>The House</span>
        </a>
      </section>

      {/*  Crop is not a link. It launches later, so it is shown but not
          offered — giving it a destination it cannot honour would be a
          worse experience than leaving it inert. */}
      <section className={`${s.panel} ${s.crop}`} aria-labelledby="crop-mark">
        <div className={s.artWrap} data-enter="ground" style={{ '--enter-delay': '120ms' }}>
          <div className={s.art} />
        </div>
        <div className={s.inner}>
          <span className={s.wordmarkMask}>
            <p className={s.wordmark} id="crop-mark" aria-label="Crop">
              {Array.from('Crop').map((ch, i) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  aria-hidden="true"
                  data-enter="char"
                  style={{ '--enter-delay': `${300 + i * 46}ms` }}
                >
                  {ch}
                </span>
              ))}
            </p>
          </span>
          <p className={s.legend} data-enter="rise" style={{ '--enter-delay': '540ms' }}>The Land</p>
          <span className={s.coming} data-enter="rise" style={{ '--enter-delay': '700ms' }}>Coming Soon</span>
        </div>
      </section>

      {/* Drawn last so the hairline sits above both grounds. The inner
          span is the glint — a short bright segment that travels the
          seam once after the line has drawn itself, the first metal on
          the site catching the light. */}
      <div className={s.rule} aria-hidden="true" data-enter="draw" style={{ '--enter-delay': '500ms' }}>
        <span className={s.seamGlint} />
      </div>
    </div>
  )
}
