import { useContext, useState } from 'react'
import PageTransition from '../components/PageTransition'
import { AppContext } from '../context/AppContext'
import { useNotification } from '../context/NotificationContext'
import useApiBase from '../hooks/useApiBase'
import { postJson } from '../lib/api'

export default function Security() {
  const { currentUser, setView } = useContext(AppContext)
  const apiBase = useApiBase()
  const { push } = useNotification()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState('idle')

  const handleChangePassword = async (event) => {
    event.preventDefault()

    if (newPassword !== confirmNewPassword) {
      push({ type: 'error', title: 'Password mismatch', message: 'New password and confirmation must match.' })
      return
    }

    setPasswordStatus('loading')
    try {
      const data = await postJson(`${apiBase}/auth/change-password`, {
        identifier: currentUser?.email || currentUser?.username,
        current_password: currentPassword,
        new_password: newPassword,
      })
      push({ type: 'success', title: 'Password changed', message: data?.message || 'Password changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error) {
      push({ type: 'error', title: 'Unable to change password', message: error?.message || 'Password change failed.' })
    } finally {
      setPasswordStatus('idle')
    }
  }

  return (
    <PageTransition>
      <section className="mx-auto w-full max-w-[920px]">
        <div className="glass rounded-3xl p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-slate-900">Security</h1>
              <p className="mt-2 text-sm text-slate-600">Change your password.</p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setView('profile-settings')}>
              Back
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleChangePassword}>
            <div>
              <label className="text-sm font-medium text-slate-700">Current password</label>
              <div className="relative mt-2">
                <input
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none focus:border-teal-500"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
                >
                  {showCurrentPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">New password</label>
              <div className="relative mt-2">
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none focus:border-teal-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Confirm new password</label>
              <div className="relative mt-2">
                <input
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none focus:border-teal-500"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
                >
                  {showConfirmNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={passwordStatus === 'loading'}>
              {passwordStatus === 'loading' ? 'Updating...' : 'Change password'}
            </button>
          </form>
        </div>
      </section>
    </PageTransition>
  )
}
