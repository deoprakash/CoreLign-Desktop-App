import React, { useEffect, useMemo, useState } from 'react'
import UploadPanel from '../components/UploadPanel'
import QueryPanel from '../components/QueryPanel'
import PageTransition from '../components/PageTransition'
import ScrollReveal from '../components/ScrollReveal'
import {
  addWorkspaceFolder,
  deleteWorkspaceFolder,
  getWorkspaceDashboardSnapshot,
  normalizeFolderName,
  renameWorkspaceFolder,
  setActiveWorkspaceFolder,
} from '../lib/workspaceStore'

export default function Workspace() {
  const [folderInput, setFolderInput] = useState('')
  const [activeFolder, setActiveFolder] = useState('')
  const [folders, setFolders] = useState([])
  const [isEditingFolderInput, setIsEditingFolderInput] = useState(false)

  useEffect(() => {
    const sync = () => {
      const snapshot = getWorkspaceDashboardSnapshot()

      setActiveFolder(snapshot.activeFolder)
      if (!isEditingFolderInput) {
        setFolderInput((prev) => {
          // Do not overwrite a typed draft with empty active folder.
          if (!snapshot.activeFolder && prev) return prev
          return snapshot.activeFolder
        })
      }
      setFolders(snapshot.folders)
    }

    sync()
    window.addEventListener('workspace-data-changed', sync)
    return () => window.removeEventListener('workspace-data-changed', sync)
  }, [isEditingFolderInput])

  const folderHelp = useMemo(() => (activeFolder ? `Current folder: ${activeFolder}` : 'No active folder selected'), [activeFolder])

  const activateFolder = () => {
    const raw = folderInput.trim()
    if (!raw) {
      window.alert('Workspace name cannot be empty.')
      return
    }

    const normalized = normalizeFolderName(raw)
    if (!normalized) {
      window.alert('Workspace name is invalid. Use letters, numbers, dashes, or underscores.')
      return
    }

    if (!activeFolder) {
      if (folders.includes(normalized)) {
        window.alert(`Workspace '${normalized}' already exists.`)
        return
      }
      addWorkspaceFolder(normalized)
      setActiveWorkspaceFolder(normalized)
      setFolderInput(normalized)
      return
    }

    const result = renameWorkspaceFolder(activeFolder, normalized)
    if (!result.ok) {
      if (result.reason === 'already_exists') {
        window.alert(`Workspace '${normalized}' already exists.`)
      }
      if (result.reason === 'invalid_name') {
        window.alert('Workspace name cannot be empty.')
      }
      return
    }

    setFolderInput(result.folder)
  }

  const removeFolder = () => {
    if (!activeFolder) return

    const ok = window.confirm(`Delete workspace '${activeFolder}'?`)
    if (!ok) return

    deleteWorkspaceFolder(activeFolder)
  }

  return (
    <PageTransition>
      <section className="space-y-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="workspace-folder">Knowledge folder</label>
            <input
              id="workspace-folder"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              onFocus={() => setIsEditingFolderInput(true)}
              onBlur={() => {
                // Let button/select clicks finish before we resync the draft field.
                window.setTimeout(() => setIsEditingFolderInput(false), 0)
              }}
              placeholder="e.g. hr-policy"
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500"
            />
            <button
              type="button"
              className="btn-primary"
              onClick={activateFolder}
            >
              Use Folder
            </button>
            <div className="relative">
              <select
                value={activeFolder}
                onChange={(e) => {
                  const selected = e.target.value
                  setActiveWorkspaceFolder(selected)
                  setFolderInput(selected)
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-white/90 px-3 py-2 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              >
                <option value="" disabled>Select workspace</option>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8l4 4 4-4" />
              </svg>
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={removeFolder}
              disabled={!activeFolder}
            >
              Delete Workspace
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{folderHelp}. Each folder keeps its own uploads and answers.</p>
        </div>

        <div className="grid gap-6 lg:items-start lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <ScrollReveal direction="left" className="lg:sticky lg:top-8">
          <UploadPanel activeFolder={activeFolder} />
        </ScrollReveal>
        <ScrollReveal direction="right" className="min-w-0">
          <QueryPanel activeFolder={activeFolder} />
        </ScrollReveal>
        </div>
      </section>
    </PageTransition>
  )
}
