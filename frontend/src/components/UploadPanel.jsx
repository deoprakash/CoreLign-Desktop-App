import { useRef, useState } from 'react'
import useApiBase from '../hooks/useApiBase'

export default function UploadPanel() {
  const apiBase = useApiBase()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadState, setUploadState] = useState({ status: 'idle', message: '', progress: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)
  const uploadRequestRef = useRef(null)

  const uploadFiles = (files) => new Promise((resolve, reject) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiBase}/upload/upload`)
    uploadRequestRef.current = xhr

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const percent = Math.round((event.loaded / event.total) * 100)
      setUploadState((prev) => ({ ...prev, progress: percent }))
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}')
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data)
        } else {
          reject(new Error(data?.detail || 'Upload failed'))
        }
      } catch (error) {
        reject(error)
      }
    }

    xhr.onabort = () => reject(new Error('Upload cancelled.'))
    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.send(formData)
  })

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!selectedFiles.length) {
      setUploadState({ status: 'error', message: 'Select one or more PDF/DOCX files to upload.', progress: 0 })
      return
    }

    setUploadState({ status: 'loading', message: 'Uploading and indexing...', progress: 0 })

    try {
      const data = await uploadFiles(selectedFiles)
      const filesIndexed = data.files_indexed ?? 0
      const totalChunks = data.total_chunks_embedded ?? 0
      setUploadState({
        status: 'success',
        message: `Uploaded ${filesIndexed}/${selectedFiles.length} files. ${totalChunks} chunks indexed.`,
        progress: 100,
      })
    } catch (error) {
      setUploadState({ status: 'error', message: error.message, progress: 0 })
    } finally {
      uploadRequestRef.current = null
    }
  }

  const handleCancelUpload = () => {
    if (uploadRequestRef.current) uploadRequestRef.current.abort()
    setUploadState({ status: 'idle', message: '', progress: 0 })
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(event.dataTransfer.files || [])
    if (droppedFiles.length) setSelectedFiles(droppedFiles)
  }

  return (
    <div className="glass rounded-3xl p-8">
      <h1 className="font-display text-3xl font-semibold text-slate-900">Upload & Index</h1>
      <p className="mt-2 text-sm text-slate-600">Add one or more DOCX/PDF files and we will chunk, embed, and index them automatically.</p>
      <form className="mt-6 space-y-4" onSubmit={handleUpload}>
        <div
          className={`rounded-2xl border border-dashed p-6 transition ${isDragging ? 'border-teal-400 bg-teal-100/80' : 'border-teal-200 bg-teal-50/70'}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragLeave={(event) => { event.preventDefault(); setIsDragging(false) }}
          onDrop={handleDrop}
        >
          <input
            accept=".pdf,.docx,.doc"
            className="hidden"
            multiple
            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            ref={fileInputRef}
            type="file"
          />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">{isDragging ? 'Drop files here' : 'Drag & drop files or browse'}</p>
            <p className="text-xs text-slate-500">Supports PDF & DOCX</p>
            <button className="btn-primary mt-5" type="button" onClick={() => fileInputRef.current?.click()}>Select files</button>
          </div>
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

        {uploadState.message ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${uploadState.status === 'success' ? 'bg-teal-50 text-teal-700' : uploadState.status === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{uploadState.message}</div>
        ) : null}
      </form>
    </div>
  )
}
