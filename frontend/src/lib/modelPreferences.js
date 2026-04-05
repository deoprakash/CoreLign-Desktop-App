const MODEL_PREFS_KEY = 'corelign_model_preferences_v1'

export const MODEL_OPTIONS = [
  {
    id: 'llama-3.1-8b-instant',
    label: 'llama-3.1-8b-instant',
    info: ['Fast', 'Lower cost', 'Good for simple queries'],
  },
  {
    id: 'llama-3.3-70b-versatile',
    label: 'llama-3.3-70b-versatile',
    info: ['High accuracy', 'Slower', 'Best for reasoning'],
  },
  {
    id: 'mixtral-8x7b-32768',
    label: 'mixtral-8x7b-32768',
    info: ['Balanced', 'Good multi-tasking'],
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    label: 'deepseek-r1-distill-llama-70b',
    info: ['Reasoning-focused', 'Strong analytical responses', 'Higher latency'],
  },
  {
    id: 'deepseek-r1-distill-qwen-32b',
    label: 'deepseek-r1-distill-qwen-32b',
    info: ['Balanced reasoning', 'Good quality/speed tradeoff'],
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'openai/gpt-oss-20b',
    info: ['OpenAI OSS', 'Fast', 'Good general-purpose model'],
  },
  {
    id: 'openai/gpt-oss-120b',
    label: 'openai/gpt-oss-120b',
    info: ['OpenAI OSS', 'Higher capability', 'Slower than 20b'],
  },
  {
    id: 'gemma2-9b-it',
    label: 'gemma2-9b-it',
    info: ['Compact', 'Fast responses', 'Cost-efficient'],
  },
  {
    id: 'qwen/qwen3-32b',
    label: 'qwen/qwen3-32b',
    info: ['Strong multilingual support', 'Balanced reasoning'],
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    label: 'meta-llama/llama-4-scout-17b-16e-instruct',
    info: ['Latest Llama generation', 'Good quality with modern instruction tuning'],
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    label: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    info: ['Higher-capacity Llama 4 variant', 'Better for harder tasks'],
  },
]

export const DEFAULT_MODEL_PREFERENCES = {
  mode: 'auto',
  model: 'llama-3.1-8b-instant',
  temperature: 0.2,
  maxTokens: 700,
  streaming: true,
}

export function clampValue(value, min, max) {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return min
  return Math.max(min, Math.min(max, numeric))
}

export function normalizeModelPreferences(raw) {
  const mode = raw?.mode === 'manual' ? 'manual' : 'auto'
  const modelIds = new Set(MODEL_OPTIONS.map((item) => item.id))
  const model = modelIds.has(raw?.model) ? raw.model : DEFAULT_MODEL_PREFERENCES.model

  return {
    mode,
    model,
    temperature: clampValue(raw?.temperature ?? DEFAULT_MODEL_PREFERENCES.temperature, 0, 1),
    maxTokens: Math.round(clampValue(raw?.maxTokens ?? DEFAULT_MODEL_PREFERENCES.maxTokens, 64, 4096)),
    streaming: Boolean(raw?.streaming ?? DEFAULT_MODEL_PREFERENCES.streaming),
  }
}

export function getModelPreferences() {
  try {
    const raw = localStorage.getItem(MODEL_PREFS_KEY)
    if (!raw) return { ...DEFAULT_MODEL_PREFERENCES }
    return normalizeModelPreferences(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_MODEL_PREFERENCES }
  }
}

export function saveModelPreferences(preferences) {
  const normalized = normalizeModelPreferences(preferences)
  localStorage.setItem(MODEL_PREFS_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new Event('model-preferences-changed'))
  return normalized
}
