import { createContext, useState } from 'react'

export const AppContext = createContext({})

export function AppProvider({ children }) {
  const [view, setView] = useState('landing')

  return (
    <AppContext.Provider value={{ view, setView }}>
      {children}
    </AppContext.Provider>
  )
}
