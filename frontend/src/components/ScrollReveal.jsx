import React, { useEffect, useRef } from 'react'

function useInView(ref, { threshold = 0.15, once = true } = {}) {
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('reveal-visible')
            if (once) obs.unobserve(el)
          }
        })
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, threshold, once])
}

function makeStyle(direction = 'up', distance = 20, duration = 0.6, delay = 0) {
  const map = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
  }
  const transform = map[direction] || map.up
  return {
    transform,
    opacity: 0,
    transition: `opacity ${duration}s cubic-bezier(.22,1,.36,1) ${delay}s, transform ${duration}s cubic-bezier(.22,1,.36,1) ${delay}s`,
  }
}

export function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  distance = 20,
  duration = 0.6,
  delay = 0,
  once = true,
  viewport = { once: true, amount: 0.15 },
  style,
  ...props
}) {
  const ref = useRef(null)
  useInView(ref, { threshold: viewport.amount ?? 0.15, once: viewport.once ?? once })
  const baseStyle = makeStyle(direction, distance, duration, delay)

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ ...baseStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export function ScrollRevealGroup({
  children,
  className = '',
  direction = 'up',
  distance = 12,
  duration = 0.55,
  stagger = 0.08,
  delay = 0,
  viewport = { once: true, amount: 0.12 },
  style,
  ...props
}) {
  const ref = useRef(null)
  useInView(ref, { threshold: viewport.amount ?? 0.12, once: viewport.once ?? true })

  const items = React.Children.toArray(children)

  return (
    <div ref={ref} className={`reveal-group ${className}`} style={style} {...props}>
      {items.map((child, i) => (
        <div key={(child && child.key) || i} className="reveal-item" style={{ transitionDelay: `${delay + i * stagger}s`, transform: `translateY(${distance}px)`, opacity: 0 }}>
          {child}
        </div>
      ))}
    </div>
  )
}

export default ScrollReveal
