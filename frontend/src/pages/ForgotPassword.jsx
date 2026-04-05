import { useContext, useState } from 'react'
import AuthShell from '../components/AuthShell'
import { AppContext } from '../context/AppContext'
import { useNotification } from '../context/NotificationContext'
import useApiBase from '../hooks/useApiBase'
import { postJson } from '../lib/api'

export default function ForgotPassword() {
  const apiBase = useApiBase()
  const { setView } = useContext(AppContext)
  const { push } = useNotification()
  const [identifier, setIdentifier] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      push({ type: 'error', title: 'Password mismatch', message: 'Password and confirmation must match.' })
      return
    }

    setStatus('loading')
    try {
      const data = await postJson(`${apiBase}/auth/forgot-password`, {
        identifier,
        new_password: newPassword,
      })
      push({ type: 'success', title: 'Password reset successful', message: data?.message || 'You can now log in with the new password.' })
      setView('login')
    } catch (error) {
      push({ type: 'error', title: 'Reset failed', message: error?.message || 'Unable to reset password.' })
    } finally {
      setStatus('idle')
    }
  }

  return (
    <AuthShell
      eyebrow="Corelign Access"
      title="Reset your password"
      subtitle="Enter your email or username and set a new password to recover access."
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-slate-900">Forgot password</p>
          <p className="mt-1 text-sm text-slate-500">Set a new password for your account.</p>
        </div>
        <button type="button" className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700" onClick={() => setView('login')}>
          Back to Login
        </button>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-700">Email or username</label>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500"
            placeholder="you@example.com or username"
          />
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
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none focus:border-teal-500"
              placeholder="Repeat new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button className="btn-primary w-full justify-center" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  )
}
