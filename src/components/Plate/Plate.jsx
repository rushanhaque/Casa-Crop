import { useEffect, useState } from 'react'
import { addItem } from '../../lib/cart'
import { PLATE_REVEALS } from '../../lib/data'
import s from './Plate.module.css'

export default function Plate({ i, range, sku, rangeSlug, reveal, product }) {
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return undefined
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  const onAdd = (e) => {
    e.preventDefault()
    addItem({
      sku,
      name: product?.name || range.name,
      range: range.meta,
      spec: range.spec
        .filter(([k]) => k === 'Alloy' || k === 'Finish')
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · '),
    })
    setAdded(true)
  }

  const revealAnim = reveal === 'none' ? undefined : (reveal || PLATE_REVEALS[i % PLATE_REVEALS.length])

  const hasPhoto = product?.photo

  return (
    <article className={s.plate} data-reveal={revealAnim} style={{ '--i': i % 4 }}>
      <span className={s.plateGhost} aria-hidden="true" data-scrub="float">
        {String(i + 1).padStart(2, '0')}
      </span>
      <div className={s.plateWell}>
        <a href={`/product.html?sku=${sku}&r=${rangeSlug}`} className={s.plateArtLink} aria-label={`View details for ${sku}`}>
          <div className={s.plateArt} style={hasPhoto ? { backgroundImage: `url(${product.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
        </a>

        <button
          className={s.add}
          type="button"
          onClick={onAdd}
          data-added={added ? '' : undefined}
          aria-label={added ? `${sku} added to cart` : `Add ${sku} to cart`}
        >
          <span className={s.addFill} aria-hidden="true" />
          <span className={s.addLabel}>
            {added ? 'Added to cart' : 'Add to cart'}
          </span>
        </button>
      </div>
      <div className={s.plateFoot}>
        <span className={s.plateSku}>{product?.name || sku}</span>
        <span className={s.plateState}>
          {product ? (product.subcategory || range.name) : 'Awaiting catalogue'}
        </span>
      </div>
    </article>
  )
}
