import s from './Progress.module.css'

/**
 * The reading rail — a brass hairline tracking how far through the
 * document you are.
 *
 * One element, one transform, no script: it is bound to the
 * document's own scroll timeline in motion.css, so it cannot drift
 * out of step with the scrollbar because it is reading the same
 * value. Shared as a component so every long page carries the same
 * rail rather than five hand-copied ones.
 */
export default function Progress() {
  return (
    <div className={s.progress} aria-hidden="true">
      <span className={s.bar} data-scrub="progress" />
    </div>
  )
}
