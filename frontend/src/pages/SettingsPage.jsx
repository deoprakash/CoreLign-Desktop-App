import { useContext } from 'react'
import PageTransition from '../components/PageTransition'
import { AppContext } from '../context/AppContext'

export default function SettingsPage() {
  const { setView } = useContext(AppContext)

  return (
    <PageTransition>
      <section className="mx-auto w-full max-w-[920px]">
        <div className="glass rounded-3xl p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-slate-900">Settings</h1>
              <p className="mt-2 text-sm text-slate-600">General application settings page.</p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setView('profile-settings')}>
              Back
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Settings page is ready for app-level configuration options.
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
