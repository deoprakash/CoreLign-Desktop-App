import { useContext, useMemo, useState } from 'react'
import PageTransition from '../components/PageTransition'
import { AppContext } from '../context/AppContext'
import {
  getModelPreferences,
  MODEL_OPTIONS,
  saveModelPreferences,
} from '../lib/modelPreferences'

export default function Preferences() {
  const { setView } = useContext(AppContext)
  const [expanded, setExpanded] = useState(false)
  const [prefs, setPrefs] = useState(getModelPreferences())

  const selectedModel = useMemo(
    () => MODEL_OPTIONS.find((model) => model.id === prefs.model) || MODEL_OPTIONS[0],
    [prefs.model],
  )

  const updatePrefs = (patch) => {
    const next = saveModelPreferences({ ...prefs, ...patch })
    setPrefs(next)
  }

  return (
    <PageTransition>
      <section className="mx-auto w-full max-w-[920px]">
        <div className="glass rounded-3xl p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-slate-900">Preferences</h1>
              <p className="mt-2 text-sm text-slate-600">Customize personal experience options.</p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setView('profile-settings')}>
              Back
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-300"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Model Selection</p>
                <p className="mt-1 text-sm text-slate-700">Choose Groq model and generation behavior</p>
              </div>
              <span className="text-sm font-semibold text-teal-700">{expanded ? 'Hide' : 'Open'}</span>
            </div>
          </button>

          {expanded ? (
            <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">Model</label>
                <select
                  value={prefs.model}
                  onChange={(event) => updatePrefs({ model: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500"
                >
                  {MODEL_OPTIONS.map((model) => (
                    <option key={model.id} value={model.id}>{model.label}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-800">{selectedModel.label}</p>
                <ul className="mt-2 space-y-1 text-sm text-teal-700">
                  {selectedModel.info.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">Mode</p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      checked={prefs.mode === 'auto'}
                      onChange={() => updatePrefs({ mode: 'auto' })}
                    />
                    Auto (recommended)
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      checked={prefs.mode === 'manual'}
                      onChange={() => updatePrefs({ mode: 'manual' })}
                    />
                    Manual
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Auto mode picks smaller model for simple queries and larger model for complex reasoning queries.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Advanced</p>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Temperature</span>
                    <span>{prefs.temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={prefs.temperature}
                    onChange={(event) => updatePrefs({ temperature: Number(event.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs text-slate-500">Max tokens</label>
                  <input
                    type="number"
                    min="64"
                    max="4096"
                    value={prefs.maxTokens}
                    onChange={(event) => updatePrefs({ maxTokens: Number(event.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500"
                  />
                </div>

                <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={prefs.streaming}
                    onChange={(event) => updatePrefs({ streaming: event.target.checked })}
                  />
                  Streaming ON/OFF
                </label>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </PageTransition>
  )
}
