import { createContext, useEffect, useState } from 'react'

export const AppContext = createContext({})

const VIEW_STORAGE_KEY = 'app_view'

export function AppProvider({ children }) {
  const getInitialView = () => {
    try {
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

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view)
    } catch (e) {
      // ignore write errors
    }
  }, [view])

  return (
    <AppContext.Provider value={{ view, setView }}>
      {children}
    </AppContext.Provider>
  )
}
