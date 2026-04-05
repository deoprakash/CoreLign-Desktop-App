export function isDesktopApp() {
  return typeof window !== 'undefined' && Boolean(window.corelignDesktop)
}

export async function getDeviceInfo() {
  const fallback = {
    device_name: typeof window !== 'undefined' ? window.location.hostname || 'browser-client' : 'browser-client',
    platform: typeof navigator !== 'undefined' ? navigator.platform || 'unknown' : 'unknown',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent || '' : '',
    mac_address: null,
  }

  if (!isDesktopApp()) {
    return fallback
  }

  try {
    const desktopInfo = await window.corelignDesktop.getDeviceInfo()
    return {
      ...fallback,
      ...(desktopInfo || {}),
      user_agent: fallback.user_agent,
    }
  } catch {
    return fallback
  }
}