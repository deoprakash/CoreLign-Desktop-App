// Minimal API helper with timeout, abort, JSON normalization, and simple retry option
import { getStoredSessionToken } from './auth'

const DEFAULT_TIMEOUT = 30000
const RAILWAY_API_BASE = 'https://corelign-desktop-app-production.up.railway.app'
// const LOCAL_API_BASE = 'http://127.0.0.1:8000'

function resolveApiBase() {
  const configured = window?.API_BASE || import.meta.env.VITE_API_BASE
  if (configured) return configured

  return RAILWAY_API_BASE
}

function timeoutFetch(resource, options = {}) {
  const { timeout = DEFAULT_TIMEOUT } = options
  const controller = options.signal ? null : new AbortController()
  const signal = options.signal || (controller ? controller.signal : undefined)

  const fetchPromise = fetch(resource, { ...options, signal })

  if (controller) {
    const t = setTimeout(() => controller.abort(), timeout)
    return fetchPromise.finally(() => clearTimeout(t))
  }
  return fetchPromise
}

async function parseJsonSafe(res) {
  try {
    return await res.json()
  } catch (e) {
    return null
  }
}

export async function apiFetch(path, opts = {}) {
  const base = resolveApiBase()
  const url = path.startsWith('http') ? path : `${base}${path}`
  const token = getStoredSessionToken()
  const mergedHeaders = {
    ...(opts.headers || {}),
  }
  if (token && !mergedHeaders.Authorization) {
    mergedHeaders.Authorization = `Bearer ${token}`
  }

  const response = await timeoutFetch(url, {
    ...opts,
    headers: mergedHeaders,
  })

  const data = await parseJsonSafe(response)
  if (!response.ok) {
    const err = {
      status: response.status,
      message: data?.message || data?.detail || response.statusText,
      code: data?.code,
      detail: data?.detail,
      meta: data?.meta,
    }
    throw err
  }
  return data
}

export async function postJson(path, body, opts = {}) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: JSON.stringify(body),
    ...opts,
  })
}

export default { apiFetch, postJson }
