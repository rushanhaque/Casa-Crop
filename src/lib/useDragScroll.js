import { useRef, useEffect } from 'react'

export function useDragScroll() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let isDown = false
    let startX
    let scrollLeft

    const onMouseDown = (e) => {
      isDown = true
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
      startX = e.pageX - el.offsetLeft
      scrollLeft = el.scrollLeft
    }

    const onMouseLeave = () => {
      isDown = false
      el.style.cursor = ''
      el.style.userSelect = ''
    }

    const onMouseUp = () => {
      isDown = false
      el.style.cursor = ''
      el.style.userSelect = ''
    }

    const onMouseMove = (e) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      const walk = (x - startX) * 1 // Scroll speed multiplier
      el.scrollLeft = scrollLeft - walk
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mouseleave', onMouseLeave)
    el.addEventListener('mouseup', onMouseUp)
    el.addEventListener('mousemove', onMouseMove)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mouseleave', onMouseLeave)
      el.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return ref
}
