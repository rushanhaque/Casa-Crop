import { useEffect, useState } from 'react'
import Cart from '../../components/Cart/Cart'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { useReveal } from '../../lib/useReveal'
import s from './Range.module.css'
import { useAutoAnimate } from '@formkit/auto-animate/react'

import Plate from '../../components/Plate/Plate'
import { RANGES, ORDER, PLATE_COUNT } from '../../lib/data'
import { getProductsByRange, subscribe } from '../../lib/products'

export default function Range() {
  useReveal()
  const [parent] = useAutoAnimate()

  const slug = new URLSearchParams(window.location.search).get('r')
  const known = slug && RANGES[slug]
  const range = known ? RANGES[slug] : RANGES[ORDER[0]]
  const activeSlug = known ? slug : ORDER[0]

  if (typeof document !== 'undefined') {
    document.title = `${range.name} — Casa and Crop`
  }

  const idx = ORDER.indexOf(activeSlug)

  const [activeFilter, setActiveFilter] = useState('All')
  const [cmsProducts, setCmsProducts] = useState(() => getProductsByRange(activeSlug))

  useEffect(() => {
    setCmsProducts(getProductsByRange(activeSlug))
    return subscribe(() => setCmsProducts(getProductsByRange(activeSlug)))
  }, [activeSlug])

  const filtered = activeFilter === 'All'
    ? cmsProducts
    : cmsProducts.filter(p => p.subcategory === activeFilter)

  /*  If there are real products, show them; otherwise fall back to
      placeholder plates up to PLATE_COUNT. */
  const showPlaceholders = cmsProducts.length === 0
  const placeholderCount = showPlaceholders ? PLATE_COUNT : Math.max(0, PLATE_COUNT - filtered.length)

  const subcategories = range.subcategories || []

  return (
    <>
      <a className={s.skip} href="#content">
        Skip to content
      </a>

      <Nav current="Collections" />
      <Progress />

      <main className={s.page} id="content">
        <section className={s.masthead}>
          <span className={s.ghost} aria-hidden="true" data-scrub="float">
            {String(idx + 1).padStart(2, '0')}
          </span>

          <p className={s.crumb} data-enter="rise">
            <a className={s.crumbLink} href="/collections.html">
              Collections
            </a>
            <span aria-hidden="true"> — </span>
            <span>{range.name}</span>
          </p>

          <Lines as="h1" className={s.title} lines={[range.name]} enter enterDelay={180} />

          <p className={s.lede} data-enter="rise" style={{ '--enter-delay': '600ms' }}>
            {range.lede}
          </p>

          {!known && slug ? (
            <p className={s.miss}>
              No range called "{slug}" — showing {range.name}.
            </p>
          ) : null}
        </section>

        {subcategories.length > 0 && (
          <div className={s.filters} role="group" aria-label="Filter by subcategory">
            {['All', ...subcategories].map(f => (
              <button
                key={f}
                className={s.filterChip}
                data-active={activeFilter === f ? '' : undefined}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <section className={s.plates} aria-label="Catalogue" ref={parent}>
          {!showPlaceholders && filtered.map((product, i) => (
            <Plate
              key={product.id}
              i={i}
              range={range}
              rangeSlug={activeSlug}
              sku={product.sku || `CC-${activeSlug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`}
              product={product}
              reveal={i < 4 ? 'none' : undefined}
            />
          ))}
          {Array.from({ length: placeholderCount }, (_, i) => {
            const offset = showPlaceholders ? i : filtered.length + i
            return (
              <Plate
                key={`ph-${i}`}
                i={offset}
                range={range}
                rangeSlug={activeSlug}
                sku={`CC-${activeSlug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`}
                reveal={offset < 4 ? 'none' : undefined}
              />
            )
          })}
        </section>
      </main>

      <Footer />
      <Cart />
    </>
  )
}
