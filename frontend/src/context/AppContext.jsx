import { createContext, useEffect, useState } from 'react'
import { isDesktopApp } from '../lib/runtime'
import { clearStoredUser, getStoredUser, saveStoredUser } from '../lib/auth'
import { postJson } from '../lib/api'

export const AppContext = createContext({})

const VIEW_STORAGE_KEY = 'app_view'
const AUTH_VIEW_STORAGE_KEY = 'auth_view'
const RAILWAY_API_BASE = 'https://corelign-desktop-app-production.up.railway.app'
// const LOCAL_API_BASE = 'http://127.0.0.1:8000'

export function AppProvider({ children }) {
  const resolveApiBase = () => {
    if (typeof window !== 'undefined') {
      const desktopBase = window?.corelignDesktop?.apiBase
      if (desktopBase) return desktopBase
      if (window?.API_BASE) return window.API_BASE
    }
    return import.meta.env.VITE_API_BASE || RAILWAY_API_BASE
  }

  const getInitialUser = () => {
    try {
      return getStoredUser()
    } catch {
      return null
    }
  }

  const getInitialView = () => {
    try {
      const storedUser = getInitialUser()
      if (!storedUser) {
        return localStorage.getItem(AUTH_VIEW_STORAGE_KEY) || 'login'
      }

      if (isDesktopApp()) return 'landing'

      // In development, always start on the landing view so the dev server
      // opening or hot-reloads don't restore the previous view from storage.
      if (import.meta.env && import.meta.env.DEV) return 'landing'

      const v = localStorage.getItem(VIEW_STORAGE_KEY)
      return v || 'landing'
    } catch (e) {
      return 'landing'
    }
  }

  const [view, setView] = useState(getInitialView)
  const [currentUser, setCurrentUserState] = useState(getInitialUser)

  const setCurrentUser = (user) => {
    setCurrentUserState(user)
  }

  const logout = async () => {
    try {
      if (currentUser?.session_token) {
        await postJson(`${resolveApiBase()}/auth/logout`, {})
      }
    } catch {
      // keep local logout resilient even if network fails
    }
    clearStoredUser()
    setCurrentUserState(null)
    setView('login')
  }

  useEffect(() => {
    try {
      if (currentUser) {
        saveStoredUser(currentUser)
        localStorage.setItem(VIEW_STORAGE_KEY, view)
      } else {
        clearStoredUser()
        localStorage.setItem(AUTH_VIEW_STORAGE_KEY, view)
      }
    } catch (e) {
      // ignore write errors
    }
  }, [view, currentUser])

  useEffect(() => {
    if (!currentUser && view !== 'login' && view !== 'register' && view !== 'forgot-password') {
      setView('login')
    }

    if (currentUser && (view === 'login' || view === 'register' || view === 'forgot-password')) {
      setView('landing')
    }
  }, [currentUser, view])

  useEffect(() => {
    if (!currentUser?.session_token) return

    const expiryValue = currentUser.session_expires_at
    const expiresAt = expiryValue ? Date.parse(expiryValue) : NaN
    if (!Number.isNaN(expiresAt) && Date.now() >= expiresAt) {
      logout()
      return
    }

    let isMounted = true

    const sendHeartbeat = async (durationSeconds) => {
      try {
        await postJson(`${resolveApiBase()}/auth/session/heartbeat`, {
          duration_seconds: durationSeconds,
        })
      } catch {
        // ignore heartbeat failures; next tick retries
      }
    }

    const intervalId = window.setInterval(() => {
      if (!isMounted) return
      sendHeartbeat(60)
    }, 60000)

    const handlePageHide = () => {
      const token = currentUser?.session_token
      if (!token) return
      const url = `${resolveApiBase()}/auth/session/heartbeat`
      try {
        fetch(url, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ duration_seconds: 5 }),
        })
      } catch {
        // ignore keepalive errors
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    sendHeartbeat(15)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [currentUser])

  return (
    <AppContext.Provider value={{ view, setView, currentUser, setCurrentUser, logout }}>
      {children}
    </AppContext.Provider>
  )
}
