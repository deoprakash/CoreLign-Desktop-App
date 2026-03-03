import { useMemo, useRef, useState } from 'react'

const features = [
  {
    title: 'Smart Ingestion',
    description: 'Drop DOCX or PDF files, auto-detect structure, and map sections into semantic chunks.',
  },
  {
    title: 'High-Recall Retrieval',
    description: 'FAISS-powered search surfaces the most relevant context in milliseconds.',
  },
  {
    title: 'Grounded Answers',
    description: 'Groq responses are anchored to your sources with traceable citations.',
  },
]

const steps = [
  { label: 'Upload', detail: 'DOCX & PDF ingestion' },
  { label: 'Chunk', detail: 'Semantic sectioning' },
  { label: 'Search', detail: 'Vector similarity' },
  { label: 'Answer', detail: 'LLM with citations' },
]

const stats = [
  { label: 'Avg. Query', value: '480ms' },
  { label: 'Docs Indexed', value: '12.4k' },
  { label: 'Chunk Recall', value: '94%' },
]

function App() {
  const [view, setView] = useState('landing')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadState, setUploadState] = useState({ status: 'idle', message: '', progress: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [queryText, setQueryText] = useState('')
  const [queryState, setQueryState] = useState({ status: 'idle', answer: '', sources: [], confidence: null })

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000',
    [],
  )

  const displaySources = useMemo(() => {
    const rawSources = Array.isArray(queryState.sources) ? queryState.sources : []
    const unique = new Map()

    rawSources.forEach((source) => {
      const file = source?.source_file || 'Unknown file'
      const section = source?.section || 'Untitled section'
      const key = `${file}::${section}`
      if (!unique.has(key)) {
        unique.set(key, { file, section })
      }
    })

    return Array.from(unique.values()).slice(0, 6)
  }, [queryState.sources])

  const fileInputRef = useRef(null)
  const uploadRequestRef = useRef(null)

  const uploadFile = (file) => new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiBase}/upload/upload`)
    uploadRequestRef.current = xhr

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }
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
    if (!selectedFile) {
      setUploadState({ status: 'error', message: 'Select a PDF or DOCX file to upload.', progress: 0 })
      return
    }

    setUploadState({ status: 'loading', message: 'Uploading and indexing...', progress: 0 })

    try {
      const data = await uploadFile(selectedFile)
      setUploadState({
        status: 'success',
        message: `Uploaded. ${data.chunks_embedded ?? 0} chunks indexed.`,
        progress: 100,
      })
    } catch (error) {
      setUploadState({ status: 'error', message: error.message, progress: 0 })
    } finally {
      uploadRequestRef.current = null
    }
  }

  const handleCancelUpload = () => {
    if (uploadRequestRef.current) {
      uploadRequestRef.current.abort()
    }
    setUploadState({ status: 'idle', message: '', progress: 0 })
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleQuery = async (event) => {
    event.preventDefault()
    if (!queryText.trim()) {
      setQueryState({ status: 'error', answer: 'Enter a question to search.', sources: [], confidence: null })
      return
    }

    setQueryState({ status: 'loading', answer: '', sources: [], confidence: null })

    try {
      const response = await fetch(`${apiBase}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText.trim(), top_k: 5 }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || 'Query failed')
      }

      setQueryState({
        status: 'success',
        answer: data.answer || 'No answer returned.',
        sources: data.sources || [],
        confidence: typeof data.confidence === 'number' ? data.confidence : null,
      })
    } catch (error) {
      setQueryState({ status: 'error', answer: error.message, sources: [], confidence: null })
    }
  }

  return (
    <div className="relative overflow-hidden">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-4 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-glow">
            <span className="text-lg font-bold">C</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Corelign</p>
            <p className="text-xs text-slate-400">Intelligent RAG Platform</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <button
            className={view === 'landing' ? 'text-slate-900' : 'hover:text-slate-900'}
            onClick={() => setView('landing')}
            type="button"
          >
            Overview
          </button>
          <button
            className={view === 'workspace' ? 'text-slate-900' : 'hover:text-slate-900'}
            onClick={() => setView('workspace')}
            type="button"
          >
            Workspace
          </button>
          <button className="btn-primary">Book a demo</button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-4">
        {view === 'workspace' ? (
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="glass rounded-3xl p-8">
              <h1 className="font-display text-3xl font-semibold text-slate-900">Upload & Index</h1>
              <p className="mt-2 text-sm text-slate-600">
                Add a DOCX or PDF and we will chunk, embed, and index it automatically.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleUpload}>
                <div
                  className={`rounded-2xl border border-dashed p-6 transition ${
                    isDragging
                      ? 'border-teal-400 bg-teal-100/80'
                      : 'border-teal-200 bg-teal-50/70'
                  }`}
                  onDragEnter={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    setIsDragging(false)
                  }}
                  onDrop={handleDrop}
                >
                  <input
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    ref={fileInputRef}
                    type="file"
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">
                      {isDragging ? 'Drop the file here' : 'Drag & drop or browse'}
                    </p>
                    <p className="text-xs text-slate-500">Supports PDF & DOCX</p>
                    <button
                      className="btn-primary mt-5"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload file
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-primary" type="submit" disabled={uploadState.status === 'loading'}>
                    {uploadState.status === 'loading' ? 'Uploading...' : 'Upload document'}
                  </button>
                  {uploadState.status === 'loading' ? (
                    <button className="btn-ghost" type="button" onClick={handleCancelUpload}>
                      Cancel upload
                    </button>
                  ) : null}
                  {selectedFile ? (
                    <span className="text-xs text-slate-500">Selected: {selectedFile.name}</span>
                  ) : null}
                </div>
                {uploadState.status === 'loading' ? (
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Uploading</span>
                      <span>{uploadState.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-teal-500 transition-all"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                {uploadState.message ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      uploadState.status === 'success'
                        ? 'bg-teal-50 text-teal-700'
                        : uploadState.status === 'error'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {uploadState.message}
                  </div>
                ) : null}
              </form>
            </div>

            <div className="glass rounded-3xl p-8">
              <h2 className="font-display text-2xl font-semibold text-slate-900">Ask a query</h2>
              <p className="mt-2 text-sm text-slate-600">
                Query your indexed docs. Answers include metadata from the most relevant chunks.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleQuery}>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500"
                  placeholder="Ask a question about your uploaded documents..."
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                />
                <button className="btn-primary" type="submit">
                  {queryState.status === 'loading' ? 'Searching...' : 'Run query'}
                </button>
              </form>
              <div className="mt-6 space-y-4">
                {queryState.answer ? (
                  <div className="rounded-2xl bg-slate-900 p-5 text-sm text-slate-100">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Answer</p>
                    <p className="mt-3">{queryState.answer}</p>
                    {queryState.confidence !== null ? (
                      <p className="mt-3 text-xs text-slate-400">
                        Confidence: {queryState.confidence}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {displaySources.length ? (
                  <div className="rounded-2xl bg-white/80 p-5">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Sources</p>
                    <ul className="mt-3 space-y-2 text-xs text-slate-600">
                      {displaySources.map((source) => (
                        <li key={`${source.file}-${source.section}`} className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-slate-700">{source.section}</p>
                          <p className="text-[11px] text-slate-400">{source.file}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {view === 'landing' ? (
          <>
            <section className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hero-grid rounded-[32px] p-10 lg:p-12">
            <div className="pill bg-teal-50 text-teal-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
              Live indexing enabled
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Turn complex documents into instant, confident answers.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
              Corelign organizes your enterprise knowledge, preserves context, and delivers fast answers grounded in
              your most trusted documents.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button className="btn-primary">Start indexing</button>
              <button className="btn-ghost">See security brief</button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl px-5 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass animate-fadeUp rounded-[28px] p-6 shadow-glow">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Document Upload</p>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">Secure</span>
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-teal-200 bg-teal-50/60 p-6 text-center">
                <p className="text-sm font-medium text-slate-700">Drag & drop or browse</p>
                <p className="text-xs text-slate-500">Supports PDF & DOCX</p>
                <button className="btn-primary mt-5">Upload file</button>
              </div>
              <div className="mt-6 space-y-4">
                {['Policy Handbook.pdf', 'Product Brief.docx', 'Compliance Guide.pdf'].map((doc) => (
                  <div key={doc} className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{doc}</p>
                      <p className="text-xs text-slate-400">Processing · 72%</p>
                    </div>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-3/4 bg-teal-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -right-10 -top-8 hidden h-32 w-32 animate-float rounded-[28px] bg-orange-200/70 blur-xl md:block" />
            <div className="absolute -bottom-10 -left-6 hidden h-28 w-28 animate-float rounded-full bg-teal-200/80 blur-2xl md:block" />
          </div>
        </section>

        <section id="capabilities" className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass rounded-3xl p-8">
            <p className="pill bg-orange-50 text-orange-600">Built for teams</p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-slate-900">
              Everything your analysts need in one interface.
            </h2>
            <p className="mt-4 text-slate-600">
              Configure data sources, define retrieval rules, and push new content live in minutes with audit-ready
              controls.
            </p>
            <div className="mt-6 grid gap-4">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-white/80 bg-white/70 p-5">
                  <p className="text-sm font-semibold text-slate-900">{feature.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="glass rounded-3xl p-7">
              <p className="text-xs uppercase tracking-wide text-slate-400">Realtime query</p>
              <p className="mt-4 text-lg font-semibold text-slate-900">"Which contracts require 30-day notice?"</p>
              <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-sm text-slate-200">
                <p className="font-medium text-white">Answer</p>
                <p className="mt-2 text-slate-300">
                  Contracts 4.2 and 5.1 include a 30-day written notice clause for termination.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-3 py-1">Policy Handbook · Section 5</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">Contracts · Appendix B</span>
                </div>
              </div>
            </div>
            <div className="glass grid gap-4 rounded-3xl p-7 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Priority queues</p>
                <p className="mt-2 text-xs text-slate-500">Schedule high impact docs first.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Access controls</p>
                <p className="mt-2 text-xs text-slate-500">Role-based routing & approvals.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="glass rounded-3xl p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-2xl font-semibold text-slate-900">Workflow built for clarity</h3>
              <p className="mt-2 text-sm text-slate-600">
                A clear pipeline keeps stakeholders aligned and results explainable.
              </p>
            </div>
            <button className="btn-ghost">Download workflow</button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.label} className="rounded-2xl border border-white/70 bg-white/70 p-5">
                <p className="text-xs font-semibold text-teal-600">Step {index + 1}</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{step.label}</p>
                <p className="mt-2 text-xs text-slate-500">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

          <section id="insights" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass relative overflow-hidden rounded-3xl p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-50/60 via-transparent to-transparent" />
            <div className="relative">
              <p className="pill bg-white text-slate-700">Ops insight</p>
              <h3 className="mt-4 font-display text-3xl font-semibold text-slate-900">
                Keep every response audit-ready.
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                Export evidence trails, confidence scores, and document provenance with a single click.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {['Evidence trails', 'Confidence scoring', 'Role-based logs'].map((item) => (
                  <span key={item} className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="glass flex flex-col justify-between rounded-3xl p-8">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Ready to pilot?</p>
              <h4 className="mt-3 font-display text-2xl font-semibold text-slate-900">Launch in under a week.</h4>
              <p className="mt-2 text-sm text-slate-600">
                We set up ingestion, retrievers, and fine-tuned prompts tailored to your docs.
              </p>
            </div>
            <button className="btn-primary mt-6">Schedule kickoff</button>
          </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default App
