import React, { useEffect, useState } from 'react'

export default function PageTransition({ children }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Trigger the enter animation on next frame
    const id = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`page-transition ${isMounted ? 'enter' : ''}`}>
      {children}
    </div>
  )
}
