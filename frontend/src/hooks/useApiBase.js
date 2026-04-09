import { useMemo } from 'react'

const RAILWAY_API_BASE = 'https://corelign-desktop-app-production.up.railway.app'
// const LOCAL_API_BASE = 'http://127.0.0.1:8000'

export default function useApiBase() {
  return useMemo(() => {
    if (typeof window !== 'undefined') {
      const desktopBase = window?.corelignDesktop?.apiBase
      if (desktopBase) return desktopBase

      if (window?.API_BASE) return window.API_BASE
    }

    return import.meta.env.VITE_API_BASE || RAILWAY_API_BASE
  }, [])
}
