import s from './Lines.module.css'

/*  The per-glyph stagger, in ms per char (entrance mode) and in range
    steps (scroll mode, capped so long lines do not smear the range
    arithmetic into soup). */
const CHAR_MS = 42
const CHAR_CAP = 14

/**
 * Type revealed one line — or one glyph — at a time, each rising from
 * behind its own baseline.
 *
 * Lines are authored explicitly rather than split at runtime. Nearly
 * every library that does this measures the rendered text and injects
 * wrappers on mount, which forces a synchronous layout, has to be
 * redone whenever the webfont loads or the viewport changes, and
 * produces a visible reflow on slow devices. Declaring the breaks in
 * markup costs nothing at runtime, never reflows, and puts the line
 * turn where the typographer wants it — which at display size is a
 * design decision, not an accident of available width.
 *
 * Two modes:
 *   reveal (default) — waits for the element to enter the viewport
 *   enter            — plays on load, for type that is already in
 *                      view. Runs on CSS keyframes alone, so the hero
 *                      is choreographed even if JavaScript never runs.
 *
 * Two grains:
 *   line (default)   — each authored line rises as one piece
 *   chars            — each glyph rises separately, pivoting from its
 *                      own foot; the stagger is per-character. When
 *                      split, the visual glyphs are aria-hidden and
 *                      the element carries the true text as a label,
 *                      so a screen reader announces words, not
 *                      letters.
 *
 * @param {string[]} lines      one string per visual line
 * @param {string}   variant    reveal animation ('line', 'tilt', …)
 * @param {string}   split      'chars' for glyph-level assembly
 * @param {number}   startIndex stagger offset, for sequencing several
 *                              blocks within one section
 * @param {number}   enterDelay ms before an entrance block begins
 */
export default function Lines({
  lines,
  as: Tag = 'span',
  className = '',
  startIndex = 0,
  reveal = true,
  enter = false,
  enterDelay = 0,
  stagger = 110,
  variant = 'line',
  split,
  ...rest
}) {
  /*  Remaining props are forwarded to the rendered element. Headings
      built with this component are referenced by aria-labelledby, so
      an id passed in here has to reach the DOM — swallowing it would
      leave every section labelled by an element that does not exist. */
  const chars = split === 'chars'

  return (
    <Tag
      className={className}
      aria-label={chars ? lines.join(' ') : undefined}
      {...rest}
    >
      {lines.map((line, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span className={s.mask} key={i} aria-hidden={chars || undefined}>
          {chars ? (
            /*  The glyphs share one mask per line — a single clipping
                box, not one per character, so the line box measures
                exactly as unsplit text would. */
            <span className={s.line}>
              {Array.from(line).map((ch, ci) =>
                ch === ' ' ? (
                  ' '
                ) : (
                  <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={ci}
                    data-enter={enter ? 'char' : undefined}
                    data-reveal={!enter && reveal ? 'char' : undefined}
                    style={
                      enter
                        ? {
                            '--enter-delay': `${
                              enterDelay + i * stagger + ci * CHAR_MS
                            }ms`,
                          }
                        : {
                            '--i': Math.min(
                              startIndex + i * 3 + ci,
                              CHAR_CAP,
                            ),
                          }
                    }
                  >
                    {ch}
                  </span>
                ),
              )}
            </span>
          ) : (
            <span
              className={s.line}
              data-enter={enter ? 'line' : undefined}
              data-reveal={!enter && reveal ? variant : undefined}
              style={
                enter
                  ? { '--enter-delay': `${enterDelay + i * stagger}ms` }
                  : { '--i': startIndex + i }
              }
            >
              {line}
            </span>
          )}
        </span>
      ))}
    </Tag>
  )
}
