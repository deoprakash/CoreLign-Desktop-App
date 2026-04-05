const FOLDER_STORAGE_KEY = 'workspace_active_folder'
const FOLDER_LIST_STORAGE_KEY = 'workspace_folder_list'
const ACTIVITY_STORAGE_KEY = 'workspace_recent_activity'
const STATS_STORAGE_KEY = 'workspace_stats_v1'
const UPLOADED_FILES_STORAGE_KEY = 'workspace_uploaded_files_v1'

export function normalizeFolderName(value) {
  const cleaned = (value || '').toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-')
  return cleaned.replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function safeRead(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event('workspace-data-changed'))
  } catch {
    // ignore storage failures
  }
}

export function getWorkspaceFolders() {
  const folders = safeRead(FOLDER_LIST_STORAGE_KEY, [])
  const normalized = Array.isArray(folders) ? folders.map(normalizeFolderName).filter(Boolean) : []
  return Array.from(new Set(normalized.filter((folder) => folder !== 'default')))
}

export function getNextAutoChatFolderName() {
  const folders = getWorkspaceFolders()
  let maxChatNumber = 0

  for (const folder of folders) {
    const match = /^chat(\d+)$/.exec(String(folder || '').toLowerCase())
    if (!match) continue
    const value = Number(match[1])
    if (!Number.isNaN(value)) {
      maxChatNumber = Math.max(maxChatNumber, value)
    }
  }

  return `chat${maxChatNumber + 1}`
}

export function ensureChatFolderForActivity(folderName) {
  const requested = normalizeFolderName(folderName)
  if (!requested) return ''
  addWorkspaceFolder(requested)
  return requested
}

export function addWorkspaceFolder(folderName) {
  const normalized = normalizeFolderName(folderName)
  if (!normalized || normalized === 'default') return ''
  const folders = getWorkspaceFolders()
  const nextFolders = Array.from(new Set([...folders, normalized]))
  safeWrite(FOLDER_LIST_STORAGE_KEY, nextFolders)
  return normalized
}

export function getActiveWorkspaceFolder() {
  const normalized = normalizeFolderName(safeRead(FOLDER_STORAGE_KEY, ''))
  if (normalized && normalized !== 'default') return normalized
  const folders = getWorkspaceFolders()
  return folders[0] || ''
}

export function setActiveWorkspaceFolder(folderName) {
  const normalized = normalizeFolderName(folderName)
  if (!normalized || normalized === 'default') {
    safeWrite(FOLDER_STORAGE_KEY, '')
    return ''
  }
  safeWrite(FOLDER_STORAGE_KEY, normalized)
  return normalized
}

export function renameWorkspaceFolder(currentFolderName, nextFolderName) {
  const current = normalizeFolderName(currentFolderName)
  const next = normalizeFolderName(nextFolderName)

  if (!current || !next) {
    return { ok: false, reason: 'invalid_name', folder: next || current || '' }
  }

  if (current === next) {
    return { ok: true, renamed: false, folder: current }
  }

  const folders = getWorkspaceFolders()
  if (!folders.includes(current)) {
    return { ok: false, reason: 'not_found', folder: current }
  }

  if (folders.includes(next)) {
    return { ok: false, reason: 'already_exists', folder: next }
  }

  const nextFolders = folders.map((folder) => (folder === current ? next : folder))
  safeWrite(FOLDER_LIST_STORAGE_KEY, nextFolders)

  if (getActiveWorkspaceFolder() === current) {
    safeWrite(FOLDER_STORAGE_KEY, next)
  }

  const stats = getWorkspaceStats()
  const nextFoldersStats = { ...(stats.folders || {}) }
  if (nextFoldersStats[current]) {
    nextFoldersStats[next] = nextFoldersStats[current]
    delete nextFoldersStats[current]
  }
  safeWrite(STATS_STORAGE_KEY, {
    docsCount: Number(stats.docsCount || 0),
    embeddingsCount: Number(stats.embeddingsCount || 0),
    queriesCount: Number(stats.queriesCount || 0),
    folders: nextFoldersStats,
  })

  const remappedActivity = getRecentActivity().map((entry) => {
    const entryFolder = normalizeFolderName(entry?.folder)
    if (entryFolder !== current) return entry
    return {
      ...entry,
      folder: next,
    }
  })
  safeWrite(ACTIVITY_STORAGE_KEY, remappedActivity)

  const uploadedFilesByFolder = safeRead(UPLOADED_FILES_STORAGE_KEY, {})
  if (uploadedFilesByFolder && typeof uploadedFilesByFolder === 'object' && uploadedFilesByFolder[current]) {
    const nextUploadedFilesByFolder = { ...uploadedFilesByFolder }
    nextUploadedFilesByFolder[next] = nextUploadedFilesByFolder[current]
    delete nextUploadedFilesByFolder[current]
    safeWrite(UPLOADED_FILES_STORAGE_KEY, nextUploadedFilesByFolder)
  }

  if (typeof window !== 'undefined') {
    try {
      const fromHistoryKey = `chat_history_${current}`
      const toHistoryKey = `chat_history_${next}`
      const fromHistory = window.localStorage.getItem(fromHistoryKey)
      const toHistory = window.localStorage.getItem(toHistoryKey)

      if (fromHistory && !toHistory) {
        window.localStorage.setItem(toHistoryKey, fromHistory)
      }
      window.localStorage.removeItem(fromHistoryKey)
      window.dispatchEvent(new Event('workspace-data-changed'))
    } catch {
      // ignore storage failures
    }
  }

  return { ok: true, renamed: true, folder: next }
}

export function deleteWorkspaceFolder(folderName) {
  const normalized = normalizeFolderName(folderName)
  if (!normalized) return false

  const folders = getWorkspaceFolders().filter((folder) => folder !== normalized)
  safeWrite(FOLDER_LIST_STORAGE_KEY, folders)

  const activeFolder = getActiveWorkspaceFolder()
  if (activeFolder === normalized) {
    safeWrite(FOLDER_STORAGE_KEY, folders[0] || '')
  }

  const stats = getWorkspaceStats()
  const removedFolderStats = stats.folders?.[normalized] || { docsCount: 0, embeddingsCount: 0, queriesCount: 0 }
  const nextFoldersStats = { ...(stats.folders || {}) }
  delete nextFoldersStats[normalized]

  safeWrite(STATS_STORAGE_KEY, {
    docsCount: Math.max(0, Number(stats.docsCount || 0) - Number(removedFolderStats.docsCount || 0)),
    embeddingsCount: Math.max(0, Number(stats.embeddingsCount || 0) - Number(removedFolderStats.embeddingsCount || 0)),
    queriesCount: Math.max(0, Number(stats.queriesCount || 0) - Number(removedFolderStats.queriesCount || 0)),
    folders: nextFoldersStats,
  })

  const recentActivity = getRecentActivity().filter((entry) => normalizeFolderName(entry.folder) !== normalized)
  safeWrite(ACTIVITY_STORAGE_KEY, recentActivity)

  const uploadedFilesByFolder = safeRead(UPLOADED_FILES_STORAGE_KEY, {})
  if (uploadedFilesByFolder && typeof uploadedFilesByFolder === 'object' && uploadedFilesByFolder[normalized]) {
    const nextUploadedFilesByFolder = { ...uploadedFilesByFolder }
    delete nextUploadedFilesByFolder[normalized]
    safeWrite(UPLOADED_FILES_STORAGE_KEY, nextUploadedFilesByFolder)
  }

  return true
}

export function clearWorkspaceFolderData(folderName) {
  const normalized = normalizeFolderName(folderName)
  if (!normalized) return getWorkspaceDashboardSnapshot()

  const stats = getWorkspaceStats()
  const removedFolderStats = stats.folders?.[normalized] || { docsCount: 0, embeddingsCount: 0, queriesCount: 0 }
  const nextFoldersStats = { ...(stats.folders || {}) }
  delete nextFoldersStats[normalized]

  safeWrite(STATS_STORAGE_KEY, {
    docsCount: Math.max(0, Number(stats.docsCount || 0) - Number(removedFolderStats.docsCount || 0)),
    embeddingsCount: Math.max(0, Number(stats.embeddingsCount || 0) - Number(removedFolderStats.embeddingsCount || 0)),
    queriesCount: Math.max(0, Number(stats.queriesCount || 0) - Number(removedFolderStats.queriesCount || 0)),
    folders: nextFoldersStats,
  })

  const recentActivity = getRecentActivity().filter((entry) => normalizeFolderName(entry.folder) !== normalized)
  safeWrite(ACTIVITY_STORAGE_KEY, recentActivity)

  const uploadedFilesByFolder = safeRead(UPLOADED_FILES_STORAGE_KEY, {})
  if (uploadedFilesByFolder && typeof uploadedFilesByFolder === 'object' && uploadedFilesByFolder[normalized]) {
    const nextUploadedFilesByFolder = { ...uploadedFilesByFolder }
    delete nextUploadedFilesByFolder[normalized]
    safeWrite(UPLOADED_FILES_STORAGE_KEY, nextUploadedFilesByFolder)
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(`chat_history_${normalized}`)
      window.dispatchEvent(new Event('workspace-data-changed'))
    } catch {
      // ignore storage failures
    }
  }

  return getWorkspaceDashboardSnapshot()
}

export function clearAllWorkspaceData() {
  const folders = getWorkspaceFolders()

  if (typeof window !== 'undefined') {
    try {
      for (const folder of folders) {
        window.localStorage.removeItem(`chat_history_${normalizeFolderName(folder)}`)
      }
    } catch {
      // ignore storage failures
    }
  }

  safeWrite(FOLDER_LIST_STORAGE_KEY, [])
  safeWrite(FOLDER_STORAGE_KEY, '')
  safeWrite(ACTIVITY_STORAGE_KEY, [])
  safeWrite(STATS_STORAGE_KEY, { docsCount: 0, embeddingsCount: 0, queriesCount: 0, folders: {} })
  safeWrite(UPLOADED_FILES_STORAGE_KEY, {})

  return getWorkspaceDashboardSnapshot()
}

export function getWorkspaceUploadedFiles(folderName) {
  const normalized = normalizeFolderName(folderName)
  if (!normalized) return []
  const uploadedFilesByFolder = safeRead(UPLOADED_FILES_STORAGE_KEY, {})
  const list = uploadedFilesByFolder?.[normalized]

  if (!Array.isArray(list)) return []

  const seen = new Set()
  const normalizedList = []
  for (const fileName of list) {
    const cleaned = String(fileName || '').trim()
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalizedList.push(cleaned)
  }
  return normalizedList
}

export function addWorkspaceUploadedFiles(folderName, fileNames = []) {
  const normalized = normalizeFolderName(folderName)
  if (!normalized) return []
  const uploadedFilesByFolder = safeRead(UPLOADED_FILES_STORAGE_KEY, {})
  const existing = Array.isArray(uploadedFilesByFolder?.[normalized])
    ? uploadedFilesByFolder[normalized].map((name) => String(name || '').trim()).filter(Boolean)
    : []

  const seen = new Set(existing.map((name) => name.toLowerCase()))
  const merged = [...existing]

  for (const fileName of fileNames) {
    const cleaned = String(fileName || '').trim()
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(cleaned)
  }

  const nextUploadedFilesByFolder = {
    ...(uploadedFilesByFolder && typeof uploadedFilesByFolder === 'object' ? uploadedFilesByFolder : {}),
    [normalized]: merged,
  }

  safeWrite(UPLOADED_FILES_STORAGE_KEY, nextUploadedFilesByFolder)
  return merged
}

export function getRecentActivity() {
  const activity = safeRead(ACTIVITY_STORAGE_KEY, [])
  return Array.isArray(activity) ? activity : []
}

export function recordWorkspaceActivity(entry) {
  const activity = getRecentActivity()
  const next = [
    {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
      ...entry,
    },
    ...activity,
  ].slice(0, 10)

  safeWrite(ACTIVITY_STORAGE_KEY, next)
  return next
}

export function getWorkspaceStats() {
  const stats = safeRead(STATS_STORAGE_KEY, { docsCount: 0, embeddingsCount: 0, queriesCount: 0, folders: {} })
  if (!stats || typeof stats !== 'object') {
    return { docsCount: 0, embeddingsCount: 0, queriesCount: 0, folders: {} }
  }

  return {
    docsCount: Number(stats.docsCount || 0),
    embeddingsCount: Number(stats.embeddingsCount || 0),
    queriesCount: Number(stats.queriesCount || 0),
    folders: stats.folders && typeof stats.folders === 'object' ? stats.folders : {},
  }
}

export function updateWorkspaceStats(folderName, patch = {}) {
  const normalized = normalizeFolderName(folderName)
  if (!normalized) return getWorkspaceStats()
  const stats = getWorkspaceStats()
  const folderStats = stats.folders[normalized] || { docsCount: 0, embeddingsCount: 0, queriesCount: 0 }

  const nextFolderStats = {
    docsCount: Number(folderStats.docsCount || 0) + Number(patch.docsCount || 0),
    embeddingsCount: Number(folderStats.embeddingsCount || 0) + Number(patch.embeddingsCount || 0),
    queriesCount: Number(folderStats.queriesCount || 0) + Number(patch.queriesCount || 0),
  }

  const next = {
    docsCount: Number(stats.docsCount || 0) + Number(patch.docsCount || 0),
    embeddingsCount: Number(stats.embeddingsCount || 0) + Number(patch.embeddingsCount || 0),
    queriesCount: Number(stats.queriesCount || 0) + Number(patch.queriesCount || 0),
    folders: {
      ...stats.folders,
      [normalized]: nextFolderStats,
    },
  }

  safeWrite(STATS_STORAGE_KEY, next)
  return next
}

export function getWorkspaceDashboardSnapshot() {
  return {
    activeFolder: getActiveWorkspaceFolder(),
    folders: getWorkspaceFolders(),
    recentActivity: getRecentActivity(),
    stats: getWorkspaceStats(),
  }
}
