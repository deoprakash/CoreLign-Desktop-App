import { useMemo, useState } from 'react'
import useApiBase from '../hooks/useApiBase'

export default function QueryPanel() {
  const apiBase = useApiBase()
  const [queryText, setQueryText] = useState('')
  const [queryState, setQueryState] = useState({ status: 'idle', answer: '', sources: [], confidence: null })

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
        body: JSON.stringify({ query: queryText.trim(), top_k: 7 }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.detail || data?.error || 'Query failed')

      setQueryState({ status: 'success', answer: data.answer || 'No answer returned.', sources: data.sources || [], confidence: typeof data.confidence === 'number' ? data.confidence : null })
    } catch (error) {
      setQueryState({ status: 'error', answer: error.message, sources: [], confidence: null })
    }
  }

  const displaySources = useMemo(() => {
    const rawSources = Array.isArray(queryState.sources) ? queryState.sources : []
    const unique = new Map()

    rawSources.forEach((source) => {
      const file = source?.source_file || 'Unknown file'
      const section = source?.section || 'Untitled section'
      const key = `${file}::${section}`
      if (!unique.has(key)) unique.set(key, { file, section })
    })

    return Array.from(unique.values()).slice(0, 6)
  }, [queryState.sources])

  return (
    <div className="glass rounded-3xl p-8">
      <h2 className="font-display text-2xl font-semibold text-slate-900">Ask a query</h2>
      <p className="mt-2 text-sm text-slate-600">Query your indexed docs. Answers include metadata from the most relevant chunks.</p>
      <form className="mt-6 space-y-4" onSubmit={handleQuery}>
        <textarea className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500" placeholder="Ask a question about your uploaded documents..." value={queryText} onChange={(e) => setQueryText(e.target.value)} />
        <button className="btn-primary" type="submit">{queryState.status === 'loading' ? 'Searching...' : 'Run query'}</button>
      </form>

      <div className="mt-6 space-y-4">
        {queryState.answer ? (
          <div className="rounded-2xl bg-slate-900 p-5 text-sm text-slate-100">
            <p className="text-xs uppercase tracking-wide text-slate-400">Answer</p>
            <p className="mt-3">{queryState.answer}</p>
            {queryState.confidence !== null ? <p className="mt-3 text-xs text-slate-400">Confidence: {queryState.confidence}</p> : null}
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
  )
}
