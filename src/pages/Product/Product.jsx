import { useEffect, useState } from 'react'
import Cart from '../../components/Cart/Cart'
import Footer from '../../components/Footer/Footer'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { addItem } from '../../lib/cart'
import { useReveal } from '../../lib/useReveal'
import { RANGES, ORDER } from '../../lib/data'
import Plate from '../../components/Plate/Plate'
import s from './Product.module.css'

export default function Product() {
  useReveal()

  const params = new URLSearchParams(window.location.search)
  const sku = params.get('sku') || 'CC-UNK-000'
  const slug = params.get('r')
  const known = slug && RANGES[slug]
  const range = known ? RANGES[slug] : RANGES[ORDER[0]]
  const activeSlug = known ? slug : ORDER[0]

  const [added, setAdded] = useState(false)

  if (typeof document !== 'undefined') {
    document.title = `${sku} — Casa and Crop`
  }

  useEffect(() => {
    if (!added) return undefined
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  const onAdd = () => {
    addItem({
      sku,
      name: range.name,
      range: range.meta,
      spec: range.spec
        .filter(([k]) => k === 'Alloy' || k === 'Finish')
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · '),
    })
    setAdded(true)
  }

  return (
    <>
      <a className={s.skip} href="#content">
        Skip to content
      </a>

      <Nav current="Collections" />
      <Progress />

      <main className={s.page} id="content">
        <div className={s.crumbWrap} data-enter="rise">
          <p className={s.crumb}>
            <a className={s.crumbLink} href="/collections.html">
              Collections
            </a>
            <span aria-hidden="true"> — </span>
            <a className={s.crumbLink} href={`/range.html?r=${activeSlug}`}>
              {range.name}
            </a>
            <span aria-hidden="true"> — </span>
            <span>{sku}</span>
          </p>
        </div>

        <section className={s.detail}>
          <div className={s.photoCol} data-enter="blur-in">
            <div className={s.photoWell}>
              <div className={s.photo} />
            </div>
          </div>
          <div className={s.infoCol} data-enter="slide-up">
            <h1 className={s.title}>{sku}</h1>
            <p className={s.meta}>{range.name} · {range.meta}</p>
            
            <dl className={s.specs}>
              {range.spec.map(([k, v]) => (
                <div className={s.specItem} key={k}>
                  <dt className={s.specKey}>{k}</dt>
                  <dd className={s.specValue}>{v}</dd>
                </div>
              ))}
            </dl>

            <button
              className={s.addBtn}
              type="button"
              onClick={onAdd}
              data-added={added ? '' : undefined}
            >
              <span className={s.addBtnFill} aria-hidden="true" />
              <span className={s.addBtnLabel}>
                {added ? 'Added to cart' : 'Add to cart'}
              </span>
            </button>
          </div>
        </section>

        <section className={s.similarSection}>
          <h2 className={s.similarTitle} data-enter="rise">Similar Products</h2>
          <div className={s.similarGrid} aria-label="Similar Products">
            {/* Displaying 4 similar items from the same range */}
            {Array.from({ length: 4 }, (_, i) => {
              const simSku = `CC-${activeSlug.slice(0, 3).toUpperCase()}-${String(i + 5).padStart(3, '0')}`
              return (
                <Plate
                  key={i}
                  i={i}
                  range={range}
                  rangeSlug={activeSlug}
                  sku={simSku}
                  reveal="slide-right"
                />
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
      <Cart />
    </>
  )
}
