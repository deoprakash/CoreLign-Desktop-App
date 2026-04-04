import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import logo from '../assets/corelignLogo.png'

export default function Header() {
  const { view, setView } = useContext(AppContext)

  return (
    <header className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 pb-4 pt-8">
      <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center">
            <img src={logo} alt="Corelign" className="object-contain" />
          </div>
        <div>
          <p className="text-xl font-semibold text-slate-600">Corelign</p>
          <p className="text-xs text-slate-400">Intelligent RAG Platform</p>
        </div>
      </div>
      <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
        <button
          className={view === 'landing' ? 'text-slate-900' : 'hover:text-slate-900'}
          onClick={() => setView('landing')}
          type="button"
        >
          Home
        </button>
        <button
          className={view === 'aboutUs' ? 'text-slate-900' : 'hover:text-slate-900'}
          onClick={() => setView('aboutUs')}
          type="button"
        >
          About Us
        </button>
        <button
          className={view === 'workspace' ? 'text-slate-900' : 'hover:text-slate-900'}
          onClick={() => setView('workspace')}
          type="button"
        >
          Workspace
        </button>
        <button
          className={view === 'insights' ? 'text-slate-900' : 'hover:text-slate-900'}
          onClick={() => setView('insights')}
          type="button"
        >
          Insights
        </button>
        <button className="btn-primary">Book a demo</button>
      </nav>
    </header>
  )
}
