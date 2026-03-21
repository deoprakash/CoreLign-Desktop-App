import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const directionOffset = {
  up: [0, 20],
  down: [0, -20],
  left: [20, 0],
  right: [-20, 0],
}

const createVariant = (dir = 'up', distance = 20, duration = 0.6) => {
  const offset = directionOffset[dir] || directionOffset.up
  return {
    hidden: { opacity: 0, x: offset[0], y: offset[1] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, ease: [0.22, 1, 0.36, 1] },
    },
    child: {
      hidden: { opacity: 0, x: offset[0] / 2, y: offset[1] / 2 },
      visible: { opacity: 1, x: 0, y: 0, transition: { duration, ease: [0.22, 1, 0.36, 1] } },
    },
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
  const variants = useMemo(() => createVariant(direction, distance, duration), [direction, distance, duration])

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={variants}
      transition={{ delay }}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
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
  const variants = useMemo(() => createVariant(direction, distance, duration), [direction, distance, duration])

  const items = React.Children.toArray(children)

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      style={style}
      {...props}
    >
      {items.map((child, i) => (
        <motion.div key={(child && child.key) || i} variants={variants.child}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

export default ScrollReveal
