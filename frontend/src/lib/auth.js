const CURRENT_USER_KEY = 'corelign_current_user'

function safeReadJson(key) {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function safeWriteJson(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event('auth-data-changed'))
  } catch {
    // ignore storage failures
  }
}

export function getStoredUser() {
  return safeReadJson(CURRENT_USER_KEY)
}

export function getStoredSessionToken() {
  const user = getStoredUser()
  const token = user?.session_token
  return typeof token === 'string' && token.trim() ? token.trim() : null
}

export function getStoredSessionExpiry() {
  const user = getStoredUser()
  return user?.session_expires_at || null
}

export function saveStoredUser(user) {
  safeWriteJson(CURRENT_USER_KEY, user)
  return user
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CURRENT_USER_KEY)
    window.dispatchEvent(new Event('auth-data-changed'))
  } catch {
    // ignore storage failures
  }
}