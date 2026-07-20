import s from './Lines.module.css'

/**
 * Type revealed one line at a time, each rising from behind its own
 * baseline.
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
 * @param {string[]} lines      one string per visual line
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
  ...rest
}) {
  /*  Remaining props are forwarded to the rendered element. Headings
      built with this component are referenced by aria-labelledby, so
      an id passed in here has to reach the DOM — swallowing it would
      leave every section labelled by an element that does not exist. */
  return (
    <Tag className={className} {...rest}>
      {lines.map((line, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span className={s.mask} key={i}>
          <span
            className={s.line}
            data-enter={enter ? 'line' : undefined}
            data-reveal={!enter && reveal ? 'line' : undefined}
            style={
              enter
                ? { '--enter-delay': `${enterDelay + i * stagger}ms` }
                : { '--i': startIndex + i }
            }
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}
