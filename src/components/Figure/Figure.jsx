import s from './Figure.module.css'

/**
 * An image in a reserved box.
 *
 * The box is sized by aspect-ratio before the image exists, which is
 * the whole point: an image that arrives without reserved space
 * shoves the page down as it decodes, and that shove is measured
 * directly as Cumulative Layout Shift. Reserving the space costs
 * nothing and removes the failure entirely.
 *
 * It also renders correctly with no `src` at all — the ratio box is
 * drawn in the ground colour and the composition holds. Photography
 * is being supplied later, and a layout that only works once the
 * assets land is a layout that cannot be judged until too late.
 *
 * @param {string}  src      final image; omit to render an empty slot
 * @param {string}  alt      empty string for decorative imagery
 * @param {string}  ratio    CSS aspect-ratio, e.g. '3 / 4'
 * @param {boolean} priority true only for the image above the fold
 * @param {string}  avif     optional modern source
 * @param {string}  webp     optional modern source
 */
export default function Figure({
  src,
  alt = '',
  ratio = '3 / 4',
  priority = false,
  sizes = '100vw',
  srcSet,
  avif,
  webp,
  className = '',
  reveal = 'settle',
  children,
  ...rest
}) {
  return (
    /*  Remaining props reach the element — data-scrub and data-reveal
        are set from the outside, and a figure that swallowed them
        would drop out of the page's choreography without any error to
        show for it. */
    <figure
      className={`${s.figure} ${className}`}
      style={{ '--ratio': ratio }}
      data-empty={src ? undefined : ''}
      {...rest}
    >
      {src ? (
        <picture>
          {avif && <source type="image/avif" srcSet={avif} sizes={sizes} />}
          {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
          <img
            className={s.img}
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            data-reveal={reveal || undefined}
            /*  The hero image is the Largest Contentful Paint element,
                so it must not be lazy and must be fetched ahead of
                everything else. Every other image on the page is
                below the fold and should not compete with it. */
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            /*  Decoding off the main thread keeps a large image from
                blocking interaction while it is being unpacked —
                which on a weak device is a genuinely long task. */
            decoding="async"
          />
        </picture>
      ) : null}
      {children}
    </figure>
  )
}
