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
        <div className={s.artWrap} data-enter="ground">
          <div className={s.art} />
        </div>
        <a className={`${s.inner} ${s.entry}`} href="/casa.html">
          <span className="mask">
            <span className={s.wordmark} id="casa-mark" data-enter="line" style={{ '--enter-delay': '180ms' }}>
              Casa
            </span>
          </span>
          <span className={s.legend} data-enter="rise" style={{ '--enter-delay': '400ms' }}>The House</span>
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
          <span className="mask">
            <p className={s.wordmark} id="crop-mark" data-enter="line" style={{ '--enter-delay': '240ms' }}>
              Crop
            </p>
          </span>
          <p className={s.legend} data-enter="rise" style={{ '--enter-delay': '460ms' }}>The Land</p>
          <span className={s.coming} data-enter="rise" style={{ '--enter-delay': '660ms' }}>Coming Soon</span>
        </div>
      </section>

      {/* Drawn last so the hairline sits above both grounds. */}
      <div className={s.rule} aria-hidden="true" data-enter="draw" style={{ '--enter-delay': '500ms' }} />
    </div>
  )
}
