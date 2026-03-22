import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const NotificationContext = createContext(null)

let idCounter = 1

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((toast) => {
    const id = (idCounter++).toString()
    const t = { id, timeout: 5000, createdAt: Date.now(), ...toast }
    setToasts((s) => [...s, t])
    if (t.timeout && t.timeout > 0) {
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== id))
      }, t.timeout)
    }
    return id
  }, [])

  const remove = useCallback((id) => setToasts((s) => s.filter((t) => t.id !== id)), [])

  return (
    <NotificationContext.Provider value={{ toasts, push, remove }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}

export default NotificationContext
