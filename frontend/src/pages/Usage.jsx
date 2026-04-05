import { useContext, useEffect, useMemo, useState } from 'react'
import PageTransition from '../components/PageTransition'
import { AppContext } from '../context/AppContext'
import { getWorkspaceDashboardSnapshot } from '../lib/workspaceStore'

function getDayLabel(offsetDays) {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

function getDayKey(offsetDays) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().slice(0, 10)
}

export default function Usage() {
  const { setView } = useContext(AppContext)
  const [snapshot, setSnapshot] = useState(getWorkspaceDashboardSnapshot())

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

  const summaryCards = useMemo(() => {
    const folders = (snapshot.folders || []).filter((folder) => folder !== 'default')
    return [
      { label: 'Projects', value: folders.length, hint: 'Tracked workspaces' },
      { label: 'Documents', value: snapshot.stats.docsCount || 0, hint: 'Indexed documents' },
      { label: 'Embeddings', value: snapshot.stats.embeddingsCount || 0, hint: 'Vectors stored' },
      { label: 'Queries', value: snapshot.stats.queriesCount || 0, hint: 'Questions asked' },
    ]
  }, [snapshot])

  const dailySeries = useMemo(() => {
    const byDay = {}
    const activities = Array.isArray(snapshot.recentActivity) ? snapshot.recentActivity : []

    for (const item of activities) {
      const ts = Number(item?.timestamp)
      if (!ts) continue
      const d = new Date(ts)
      d.setHours(0, 0, 0, 0)
      const dayKey = d.toISOString().slice(0, 10)
      if (!byDay[dayKey]) {
        byDay[dayKey] = { total: 0, upload: 0, query: 0 }
      }
      byDay[dayKey].total += 1
      if (item.type === 'upload') byDay[dayKey].upload += 1
      if (item.type === 'query') byDay[dayKey].query += 1
    }

    const points = []
    for (let i = 6; i >= 0; i -= 1) {
      const key = getDayKey(i)
      const day = byDay[key] || { total: 0, upload: 0, query: 0 }
      points.push({
        key,
        label: getDayLabel(i),
        ...day,
      })
    }

    const maxTotal = Math.max(1, ...points.map((p) => p.total))
    return { points, maxTotal }
  }, [snapshot.recentActivity])

  return (
    <PageTransition>
      <section className="mx-auto w-full max-w-[1100px]">
        <div className="glass rounded-3xl p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-slate-900">Usage</h1>
              <p className="mt-2 text-sm text-slate-600">Track daily activity with cards and graph insights.</p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setView('profile-settings')}>
              Back
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-500">{card.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Daily Activities (Last 7 Days)</h2>
              <p className="text-xs text-slate-500">Uploads + Queries</p>
            </div>

            <div className="mt-5 grid grid-cols-7 items-end gap-3">
              {dailySeries.points.map((point) => {
                const heightPercent = Math.max(6, Math.round((point.total / dailySeries.maxTotal) * 100))
                return (
                  <div key={point.key} className="flex flex-col items-center gap-2">
                    <div className="flex h-40 w-full max-w-[48px] items-end rounded-xl bg-slate-100 p-1">
                      <div
                        className="w-full rounded-lg bg-teal-600"
                        style={{ height: `${heightPercent}%` }}
                        title={`${point.total} total (${point.upload} uploads, ${point.query} queries)`}
                      />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">{point.label}</p>
                    <p className="text-xs font-semibold text-slate-700">{point.total}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {dailySeries.points.slice(-2).map((point) => (
                <div key={`${point.key}-breakdown`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">{point.label}</p>
                  <p className="mt-1">Uploads: {point.upload}</p>
                  <p>Queries: {point.query}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
