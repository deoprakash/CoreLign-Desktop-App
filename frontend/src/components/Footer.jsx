import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import logo from '../assets/corelignLogo.png'

const APP_VERSION = 'v1.0.0'

export default function Footer() {
  const { setView, currentUser } = useContext(AppContext)

  return (
    <footer className="mx-auto mt-8 w-full max-w-[1400px] px-6 pb-6 sm:px-10 lg:px-14">
      <div className="rounded-2xl border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center">
              <img src={logo} alt="Corelign" className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Corelign</p>
              <p className="text-xs text-slate-500">Intelligent RAG Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 sm:justify-end sm:text-sm">
            {currentUser ? (
              <>
                <button type="button" className="transition hover:text-slate-900">Privacy</button>
                <button type="button" className="transition hover:text-slate-900">Terms</button>
              </>
            ) : (
              <>
                <button type="button" className="transition hover:text-slate-900">Privacy</button>
                <button type="button" className="transition hover:text-slate-900">Terms</button>
              </>
            )}
            <span className="text-slate-400">{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
