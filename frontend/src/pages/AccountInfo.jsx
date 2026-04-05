import { useContext, useEffect, useState } from 'react'
import PageTransition from '../components/PageTransition'
import { AppContext } from '../context/AppContext'
import { useNotification } from '../context/NotificationContext'

export default function AccountInfo() {
  const { currentUser, setCurrentUser, setView } = useContext(AppContext)
  const { push } = useNotification()
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    setDisplayName(currentUser?.display_name || currentUser?.username || '')
  }, [currentUser])

  const handleSave = (event) => {
    event.preventDefault()
    const nextDisplayName = displayName.trim()
    if (!nextDisplayName) return

    setCurrentUser({
      ...currentUser,
      display_name: nextDisplayName,
    })
    push({ type: 'success', title: 'Account updated', message: 'Display name updated successfully.' })
  }

  return (
    <PageTransition>
      <section className="mx-auto w-full max-w-[920px]">
        <div className="glass rounded-3xl p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-slate-900">Account Info</h1>
              <p className="mt-2 text-sm text-slate-600">View and update your profile details.</p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setView('profile-settings')}>
              Back
            </button>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSave}>
            <div>
              <label className="text-sm font-medium text-slate-700">Username</label>
              <input
                value={currentUser?.username || ''}
                disabled
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                value={currentUser?.email || ''}
                disabled
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Display name</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500"
                placeholder="How your name appears in the app"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button className="btn-primary" type="submit">Save changes</button>
              <button type="button" className="btn-ghost" onClick={() => setView('profile-settings')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </PageTransition>
  )
}
