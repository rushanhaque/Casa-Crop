import { useEffect, useState } from 'react'
import Cart from '../../components/Cart/Cart'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { addItem } from '../../lib/cart'
import { useReveal } from '../../lib/useReveal'
import s from './Range.module.css'

import Plate from '../../components/Plate/Plate'
import { RANGES, ORDER, PLATE_COUNT } from '../../lib/data'

export default function Range() {
  useReveal()

  const slug = new URLSearchParams(window.location.search).get('r')
  const known = slug && RANGES[slug]
  const range = known ? RANGES[slug] : RANGES[ORDER[0]]
  const activeSlug = known ? slug : ORDER[0]

  if (typeof document !== 'undefined') {
    document.title = `${range.name} — Casa and Crop`
  }

  const idx = ORDER.indexOf(activeSlug)

  return (
    <>
      <a className={s.skip} href="#content">
        Skip to content
      </a>

      <Nav current="Collections" />
      <Progress />

      <main className={s.page} id="content">
        <section className={s.masthead}>
          {/*  The range number, set enormous and ghosted behind the
              name — the pattern-book plate number as architecture. */}
          {/*  The plate number floats slower than the page — the
              tooling layer sits visibly behind the content layer. */}
          <span className={s.ghost} aria-hidden="true" data-scrub="float">
            {String(idx + 1).padStart(2, '0')}
          </span>

          <p className={s.crumb} data-enter="rise">
            <a className={s.crumbLink} href="/collections.html">
              Collections
            </a>
            <span aria-hidden="true"> — </span>
            <span>{range.meta}</span>
          </p>

          <Lines as="h1" className={s.title} lines={[range.name]} enter enterDelay={180} />

          <p className={s.lede} data-enter="rise" style={{ '--enter-delay': '600ms' }}>
            {range.lede}
          </p>

          {!known && slug ? (
            <p className={s.miss}>
              No range called “{slug}” — showing {range.name}.
            </p>
          ) : null}
        </section>

        <section className={s.plates} aria-label="Catalogue">
          {Array.from({ length: PLATE_COUNT }, (_, i) => (
            <Plate
              key={i}
              i={i}
              range={range}
              rangeSlug={activeSlug}
              sku={`CC-${activeSlug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`}
              reveal={i < 4 ? 'none' : undefined}
            />
          ))}
        </section>
      </main>

      <Footer />
      <Cart />
    </>
  )
}
