import { useContext, useEffect, useMemo, useState } from 'react'
import PageTransition from '../components/PageTransition'
import ScrollReveal from '../components/ScrollReveal'
import { AppContext } from '../context/AppContext'
import {
  addWorkspaceFolder,
  clearAllWorkspaceData,
  deleteWorkspaceFolder,
  getWorkspaceDashboardSnapshot,
  normalizeFolderName,
  setActiveWorkspaceFolder,
} from '../lib/workspaceStore'

function formatTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleString()
  } catch {
    return 'Just now'
  }
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

export default function Home() {
  const { setView, currentUser } = useContext(AppContext)
  const [snapshot, setSnapshot] = useState(getWorkspaceDashboardSnapshot())
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning!'
    if (hour < 17) return 'Good afternoon!'
    return 'Good evening!'
  }, [])

  const displayName = useMemo(
    () => currentUser?.display_name || currentUser?.username || 'User',
    [currentUser],
  )

  useEffect(() => {
    const sync = () => setSnapshot(getWorkspaceDashboardSnapshot())
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('workspace-data-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('workspace-data-changed', sync)
    }
  }, [])

  const stats = useMemo(() => {
    const folders = snapshot.folders || []
    const folderStatsEntries = Object.entries(snapshot.stats.folders || {})
    const documentsCount = folderStatsEntries.reduce((sum, [, value]) => sum + Number(value?.docsCount || 0), 0)
    const embeddingsCount = folderStatsEntries.reduce((sum, [, value]) => sum + Number(value?.embeddingsCount || 0), 0)
    const queriesCount = folderStatsEntries.reduce((sum, [, value]) => sum + Number(value?.queriesCount || 0), 0)

    return [
      { label: 'Projects', value: folders.length, hint: 'Uploaded folders or collections' },
      { label: 'Documents', value: documentsCount, hint: 'Indexed documents' },
      { label: 'Embeddings', value: embeddingsCount, hint: 'Vectors stored' },
      { label: 'Queries', value: queriesCount, hint: 'Questions asked' },
    ]
  }, [snapshot])

  const visibleRecentActivity = useMemo(
    () => snapshot.recentActivity || [],
    [snapshot.recentActivity],
  )

  const projectFolders = useMemo(
    () => snapshot.folders || [],
    [snapshot.folders],
  )

  const createWorkspace = () => {
    const raw = newWorkspaceName.trim()
    if (!raw) {
      window.alert('Workspace name cannot be empty.')
      return
    }

    const normalized = normalizeFolderName(raw)
    if (!normalized) {
      window.alert('Workspace name is invalid. Use letters, numbers, dashes, or underscores.')
      return
    }
    if (projectFolders.includes(normalized)) {
      window.alert(`Workspace '${normalized}' already exists.`)
      return
    }

    addWorkspaceFolder(normalized)
    setActiveWorkspaceFolder(normalized)
    setNewWorkspaceName('')
    setSnapshot(getWorkspaceDashboardSnapshot())
    setView('workspace')
  }

  const openWorkspace = (folderName) => {
    setActiveWorkspaceFolder(folderName)
    setSnapshot(getWorkspaceDashboardSnapshot())
    setView('workspace')
  }

  const removeWorkspace = (event, folderName) => {
    event.stopPropagation()

    const ok = window.confirm(`Delete workspace '${folderName}'?`)
    if (!ok) return

    deleteWorkspaceFolder(folderName)
    setSnapshot(getWorkspaceDashboardSnapshot())
  }

  const clearAllWorkspaces = () => {
    const ok = window.confirm('Delete all workspaces and clear all local workspace data?')
    if (!ok) return
    setSnapshot(clearAllWorkspaceData())
  }

  return (
    <PageTransition>
      <section className="space-y-8">
        <ScrollReveal className="hero-grid rounded-[32px] p-8 lg:p-10" direction="up">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                {greeting}
              </h1>
              <p className="mt-4 max-w-4xl text-xl text-slate-600 sm:text-2xl">
                Welcome Back {displayName}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" type="button" onClick={() => setView('workspace')}>
                Open Workspace
              </button>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl bg-white/75 p-6 shadow-sm backdrop-blur h-[640px] flex flex-col">
            <div>
              <div>
                <h2 className="font-display text-3xl font-semibold text-slate-900 lg:text-4xl">Projects</h2>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  value={newWorkspaceName}
                  onChange={(event) => setNewWorkspaceName(event.target.value)}
                  placeholder="New workspace name"
                  className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500"
                />
                <button type="button" className="btn-primary whitespace-nowrap" onClick={createWorkspace}>
                  Create Workspace
                </button>
                <button type="button" className="btn-ghost whitespace-nowrap" onClick={clearAllWorkspaces}>
                  Delete All Workspaces
                </button>
              </div>
            </div>

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto scrollbar-invisible pr-1">
              <div className="grid gap-5 md:grid-cols-2">
                {projectFolders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 md:col-span-2">
                    No workspace is there.
                  </div>
                ) : null}
                {projectFolders.map((folder) => {
                  const folderStats = snapshot.stats.folders?.[folder] || { docsCount: 0, embeddingsCount: 0, queriesCount: 0 }
                  const isActive = folder === snapshot.activeFolder
                  return (
                    <div
                      key={folder}
                      onClick={() => openWorkspace(folder)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openWorkspace(folder)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`min-h-[180px] rounded-2xl border p-5 text-left transition ${isActive ? 'border-teal-400 bg-teal-50/80' : 'border-slate-200 bg-white/90 hover:border-teal-200 hover:bg-teal-50/40'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{folder}</p>
                          <p className="mt-1 text-xs text-slate-500">{isActive ? 'Active workspace' : 'Project folder'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white">
                            {folderStats.docsCount} docs
                          </span>
                          <button
                            type="button"
                            onClick={(event) => removeWorkspace(event, folder)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                            aria-label={`Delete workspace ${folder}`}
                            title="Delete workspace"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-600">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-slate-400">Docs</p>
                          <p className="mt-1 font-semibold text-slate-900">{folderStats.docsCount}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-slate-400">Embeddings</p>
                          <p className="mt-1 font-semibold text-slate-900">{folderStats.embeddingsCount}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-slate-400">Queries</p>
                          <p className="mt-1 font-semibold text-slate-900">{folderStats.queriesCount}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-900 p-6 text-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-white">Recent activity</h2>
                  <p className="mt-1 text-sm text-slate-300">Latest uploads and queries across your workspaces</p>
                </div>
              </div>
              <div className="scrollbar-invisible mt-5 h-[456px] space-y-3 overflow-y-auto">
                {visibleRecentActivity.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    No activity yet. Upload a document to start.
                  </div>
                ) : (
                  visibleRecentActivity.map((item) => (
                    <div key={item.id} className="h-36 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>{item.folder}</span>
                        <span>{formatTime(item.timestamp)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white/75 p-6 shadow-sm backdrop-blur">
              <h2 className="font-display text-2xl font-semibold text-slate-900">Quick actions</h2>
              <div className="mt-5 grid gap-3">
                <button type="button" className="btn-primary w-full" onClick={() => setView('workspace')}>
                  Go to Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
