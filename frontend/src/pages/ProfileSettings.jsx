import { useContext } from 'react'
import PageTransition from '../components/PageTransition'
import { AppContext } from '../context/AppContext'

export default function ProfileSettings() {
  const { setView, logout } = useContext(AppContext)

  const options = [
    { key: 'account-info', label: 'Account Info', hint: 'Update profile details' },
    { key: 'security', label: 'Security', hint: 'Change your password' },
    { key: 'preferences', label: 'Preferences', hint: 'Tune your experience' },
    { key: 'usage', label: 'Usage', hint: 'See your activity summary' },
    { key: 'settings', label: 'Settings', hint: 'General application settings' },
  ]

  return (
    <PageTransition>
      <section className="mx-auto w-full max-w-[980px]">
        <div className="glass rounded-3xl p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-slate-900">Profile Options</h1>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setView('landing')}>
              Back to Home
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setView(option.key)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-teal-300 hover:bg-teal-50/40"
              >
                <p className="text-base font-semibold text-slate-900">{option.label}</p>
                <p className="mt-1 text-xs text-slate-500">{option.hint}</p>
              </button>
            ))}

            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-left transition hover:bg-rose-100"
            >
              <p className="text-base font-semibold text-rose-700">Logout</p>
              <p className="mt-1 text-xs text-rose-500">Sign out from your account</p>
            </button>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
