import { useContext, useMemo } from 'react'
import { AppContext } from '../context/AppContext'
import logo from '../assets/corelignLogo.png'

export default function Header() {
  const { view, setView, currentUser } = useContext(AppContext)

  const initials = useMemo(() => {
    const full = String(currentUser?.display_name || currentUser?.username || 'U').trim()
    const parts = full.split(/\s+/).filter(Boolean)
    if (!parts.length) return 'U'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
  }, [currentUser])

  return (
    <header className="mx-auto mt-3 flex w-full max-w-[1400px] items-center justify-between rounded-2xl border border-white/70  px-14 py-4 shadow-lg shadow-slate-300/40 backdrop-blur">
      <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center">
            <img src={logo} alt="Corelign" className="object-contain" />
          </div>
        <div>
          <p className="text-xl font-semibold text-slate-600">Corelign</p>
          <p className="text-xs text-slate-400">Intelligent RAG Platform</p>
        </div>
      </div>
      <nav className="hidden items-center gap-3 text-sm font-medium text-slate-600 md:flex">
        <button
          className={view === 'landing' ? 'text-slate-900' : 'hover:text-slate-900'}
          onClick={() => setView('landing')}
          type="button"
        >
          Home
        </button>
        <button
          className={view === 'workspace' ? 'text-slate-900' : 'hover:text-slate-900'}
          onClick={() => setView('workspace')}
          type="button"
        >
          Workspace
        </button>
        <button
          type="button"
          onClick={() => setView('profile-settings')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white shadow-md shadow-teal-700/30 transition hover:bg-teal-600"
          aria-label="Open profile options"
          title={currentUser?.display_name || currentUser?.username || 'User'}
        >
          {initials}
        </button>
      </nav>
    </header>
  )
}
