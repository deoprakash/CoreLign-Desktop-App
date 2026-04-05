import { useState } from 'react'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { useNotification } from '../context/NotificationContext'
import useApiBase from '../hooks/useApiBase'
import { postJson } from '../lib/api'
import { saveStoredUser } from '../lib/auth'
import AuthShell from '../components/AuthShell'
import { getDeviceInfo } from '../lib/runtime'

export default function Register() {
  const apiBase = useApiBase()
  const { setView, setCurrentUser } = useContext(AppContext)
  const { push } = useNotification()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      push({ type: 'error', title: 'Password mismatch', message: 'Password and confirmation must match.' })
      return
    }

    setStatus('loading')
    try {
      const deviceInfo = await getDeviceInfo()
      const data = await postJson(`${apiBase}/auth/register`, {
        username,
        email,
        display_name: displayName,
        password,
        device_info: deviceInfo,
      })
      const loggedInUser = {
        ...data.user,
        session_token: data.session_token,
        session_expires_at: data.session_expires_at,
        session_id: data.session_id,
      }
      saveStoredUser(loggedInUser)
      setCurrentUser(loggedInUser)
      setView('landing')
      push({ type: 'success', title: 'Account created', message: `Welcome, ${data.user.display_name || data.user.username}.` })
    } catch (error) {
      push({ type: 'error', title: 'Registration failed', message: error?.message || 'Unable to create account.' })
    } finally {
      setStatus('idle')
    }
  }

  return (
    <AuthShell
      eyebrow="Corelign Access"
      title="Create your account"
      subtitle="Register once and keep your workspace, uploads, and conversations tied to your user account in MongoDB."
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-slate-900">Register</p>
          <p className="mt-1 text-sm text-slate-500">Create a new account for Corelign.</p>
        </div>
        <button type="button" className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700" onClick={() => setView('login')}>
          Login
        </button>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-700">Username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500"
            placeholder="Choose a username"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Display name</label>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <div className="relative mt-2">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none focus:border-teal-500"
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Confirm password</label>
          <div className="relative mt-2">
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none focus:border-teal-500"
              placeholder="Repeat your password"
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
          {status === 'loading' ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </AuthShell>
  )
}