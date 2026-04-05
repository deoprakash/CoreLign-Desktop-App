import { useEffect, useMemo, useRef, useState } from 'react'
import useApiBase from '../hooks/useApiBase'
import { useNotification } from '../context/NotificationContext'
import {
  addWorkspaceFolder,
  addWorkspaceUploadedFiles,
  ensureChatFolderForActivity,
  getWorkspaceUploadedFiles,
  recordWorkspaceActivity,
  updateWorkspaceStats,
} from '../lib/workspaceStore'

const PIPELINE_STEPS = ['Loader', 'Chunking', 'Embedding', 'Store']

function stageIndexFromProgress(progress) {
  if (progress >= 90) return 3
  if (progress >= 65) return 2
  if (progress >= 35) return 1
  if (progress > 0) return 0
  return -1
}

export default function UploadPanel({ activeFolder = '' }) {
  const apiBase = useApiBase()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [metadataTags, setMetadataTags] = useState('')
  const [fileStatuses, setFileStatuses] = useState([])
  const [uploadState, setUploadState] = useState({ status: 'idle', message: '', progress: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)
  const progressTimerRef = useRef(null)
  const { push } = useNotification()

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setSelectedFiles([])
    setFileStatuses([])
    setUploadState({ status: 'idle', message: '', progress: 0 })
    setUploadedFiles(getWorkspaceUploadedFiles(activeFolder))
  }, [activeFolder])

  const activeStageIndex = useMemo(() => {
    if (uploadState.status === 'success') return 3
    if (uploadState.status !== 'loading') return -1
    return stageIndexFromProgress(uploadState.progress)
  }, [uploadState])

  const setFiles = (files) => {
    setSelectedFiles(files)
    setFileStatuses(files.map((file) => ({ name: file.name, status: 'Uploaded' })))
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!activeFolder) {
      setUploadState({ status: 'error', message: 'Set a workspace name first.', progress: 0 })
      return
    }
    if (!selectedFiles.length) {
      setUploadState({ status: 'error', message: 'Select one or more PDF/DOCX files to upload.', progress: 0 })
      return
    }

    const effectiveFolder = ensureChatFolderForActivity(activeFolder)
    if (!effectiveFolder) {
      setUploadState({ status: 'error', message: 'Set a valid workspace name first.', progress: 0 })
      return
    }

    setUploadState({ status: 'loading', message: 'Uploading documents...', progress: 5 })
    setFileStatuses((prev) => prev.map((entry) => ({ ...entry, status: 'Processing' })))

    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    progressTimerRef.current = setInterval(() => {
      setUploadState((prev) => {
        if (prev.status !== 'loading') return prev
        const next = Math.min(90, prev.progress + Math.floor(Math.random() * 8 + 3))
        return { ...prev, progress: next }
      })
    }, 450)

    try {
      const formData = new FormData()
      selectedFiles.forEach((file) => formData.append('files', file))
      formData.append('folder_id', effectiveFolder)
      if (metadataTags.trim()) {
        formData.append('metadata_tags', metadataTags.trim())
      }

      const response = await fetch(`${apiBase}/upload/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.detail || 'Upload failed')
      }

      const skippedDuplicates = Number(data.files_skipped_duplicates ?? 0)
      const duplicateNotice = skippedDuplicates > 0
        ? ` ${skippedDuplicates} file${skippedDuplicates > 1 ? 's' : ''} skipped (already exists in this folder).`
        : ''

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }

      const documents = Array.isArray(data.documents) ? data.documents : []
      const documentStatusByName = new Map(documents.map((doc) => [doc.file_name, doc]))

      setFileStatuses((prev) => prev.map((entry) => {
        const doc = documentStatusByName.get(entry.name)
        if (!doc) return { ...entry, status: 'Uploaded' }
        return {
          ...entry,
          status: Number(doc.chunks_embedded || 0) > 0 ? 'Embedded' : 'Uploaded',
        }
      }))

      setUploadState({
        status: 'success',
        message: `Uploaded ${data.files_indexed ?? selectedFiles.length} files. ${data.total_chunks_embedded ?? 0} chunks indexed.${duplicateNotice}`,
        progress: 100,
      })
      const persistedUploadedFiles = addWorkspaceUploadedFiles(
        effectiveFolder,
        documents.map((doc) => doc.file_name).filter(Boolean),
      )
      setUploadedFiles(persistedUploadedFiles)
      addWorkspaceFolder(effectiveFolder)
      updateWorkspaceStats(effectiveFolder, {
        docsCount: Number(data.files_indexed ?? 0),
        embeddingsCount: Number(data.total_chunks_embedded ?? 0),
      })
      recordWorkspaceActivity({
        type: 'upload',
        folder: effectiveFolder,
        title: `Uploaded ${data.files_indexed ?? 0} document(s)`,
        detail: `${data.total_chunks_embedded ?? 0} embeddings indexed${duplicateNotice}`,
      })
      try {
        push({
          type: skippedDuplicates > 0 ? 'warn' : 'success',
          title: skippedDuplicates > 0 ? 'Upload complete with skipped duplicates' : 'Upload complete',
          message: `Uploaded ${data.files_indexed ?? selectedFiles.length} files.${duplicateNotice}`,
        })
      } catch (e) {}
    } catch (error) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      setUploadState({ status: 'error', message: error.message, progress: 0 })
      setFileStatuses((prev) => prev.map((entry) => ({ ...entry, status: 'Uploaded' })))
      try { push({ type: 'error', title: 'Upload failed', message: error.message }) } catch (e) {}
    }
  }

  const handleCancelUpload = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setUploadState({ status: 'idle', message: '', progress: 0 })
    setFileStatuses((prev) => prev.map((entry) => ({ ...entry, status: 'Uploaded' })))
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(event.dataTransfer.files || [])
    if (droppedFiles.length) setFiles(droppedFiles)
  }

  const mergedFileRows = useMemo(() => {
    const rows = []
    const currentByName = new Map(fileStatuses.map((entry) => [entry.name.toLowerCase(), entry]))

    for (const fileName of uploadedFiles) {
      const match = currentByName.get(fileName.toLowerCase())
      rows.push({
        name: fileName,
        status: match ? match.status : 'Indexed',
      })
    }

    for (const entry of fileStatuses) {
      const exists = uploadedFiles.some((name) => name.toLowerCase() === entry.name.toLowerCase())
      if (!exists) {
        rows.push(entry)
      }
    }

    return rows
  }, [fileStatuses, uploadedFiles])

  return (
    <div className="glass rounded-3xl p-6 lg:p-5 xl:p-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Upload & Index</h1>
      <p className="mt-2 text-sm text-slate-600">Add DOCX/PDF files and we will chunk, embed, and index them automatically.</p>
      <p className="mt-1 text-xs text-slate-500">Active folder: {activeFolder}</p>
      <form className="mt-6 space-y-4" onSubmit={handleUpload}>
        <div
          className={`rounded-2xl border border-dashed p-5 transition ${isDragging ? 'border-teal-400 bg-teal-100/80' : 'border-teal-200 bg-teal-50/70'}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragLeave={(event) => { event.preventDefault(); setIsDragging(false) }}
          onDrop={handleDrop}
        >
          <input
            accept=".pdf,.docx,.doc"
            className="hidden"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
            ref={fileInputRef}
            type="file"
          />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">{isDragging ? 'Drop files here' : 'Drag & drop files or browse'}</p>
            <p className="text-xs text-slate-500">Supports PDF & DOCX</p>
            <button className="btn-primary mt-4" type="button" onClick={() => fileInputRef.current?.click()}>Select files</button>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata tags (optional for MVP)</p>
          <input
            value={metadataTags}
            onChange={(event) => setMetadataTags(event.target.value)}
            placeholder="example: department:hr, region:india"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" type="submit" disabled={uploadState.status === 'loading'}>{uploadState.status === 'loading' ? 'Uploading...' : 'Upload documents'}</button>
          {uploadState.status === 'loading' ? (
            <button className="btn-ghost" type="button" onClick={handleCancelUpload}>Cancel upload</button>
          ) : null}
          {selectedFiles.length ? (
            <span className="text-xs text-slate-500">Selected ({selectedFiles.length}): {selectedFiles.slice(0, 3).map((file) => file.name).join(', ')}{selectedFiles.length > 3 ? ', ...' : ''}</span>
          ) : null}
        </div>

        {uploadState.status === 'loading' ? (
          <div className="rounded-2xl bg-white/80 px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>Uploading</span><span>{uploadState.progress}%</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-teal-500 transition-all" style={{ width: `${uploadState.progress}%` }} /></div>
          </div>
        ) : null}

        <div className="rounded-2xl bg-white/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline status</p>
            <p className="text-xs text-slate-500">Loader → Chunking → Embedding → Store</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const completed = activeStageIndex > idx || uploadState.status === 'success'
              const active = activeStageIndex === idx && uploadState.status === 'loading'
              return (
                <div
                  key={step}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium ${completed ? 'border-teal-200 bg-teal-50 text-teal-700' : active ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                >
                  {step}
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Files & status</p>
          {mergedFileRows.length === 0 ? (
            <p className="text-sm text-slate-500">No files selected yet.</p>
          ) : (
            <div className="space-y-2">
              {mergedFileRows.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="truncate pr-3 text-sm text-slate-700">{entry.name}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${entry.status === 'Embedded' || entry.status === 'Indexed' ? 'bg-teal-100 text-teal-700' : entry.status === 'Processing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {uploadState.message ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${uploadState.status === 'success' ? 'bg-teal-50 text-teal-700' : uploadState.status === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{uploadState.message}</div>
        ) : null}
      </form>
    </div>
  )
}
