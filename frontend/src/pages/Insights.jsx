import React, { useMemo } from 'react'
import MetricChart from '../components/MetricChart'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement)

const sampleMetrics = [
  { label: 'Precision', value: 0.923, color: '#FF9AA2' },
  { label: 'Recall', value: 0.923, color: '#9BCBFF' },
  { label: 'F1 Score', value: 0.923, color: '#BDF7C6' },
  { label: 'Semantic Similarity', value: 0.92, color: '#FFD59E' },
]

const timingSeries = [
  { name: 'Avg Response', value: 647.72 },
  { name: 'Avg Retrieval', value: 23.85 },
  { name: 'Avg Generation', value: 483.83 },
]

const bleuData = {
  labels: ['Factual', 'Concept', 'Reasoning', 'Multi-hop'],
  datasets: [
    {
      label: 'BLEU',
      data: [0.9, 0.62, 0.57, 0.53],
      backgroundColor: ['#7ED957', '#4DA8FF', '#FFD45E', '#FF65A3'],
      borderRadius: 8,
    },
  ],
}

const rougeData = {
  labels: ['ROUGE-1', 'ROUGE-2', 'ROUGE-L'],
  datasets: [
    {
      label: 'ROUGE',
      data: [0.78, 0.65, 0.72],
      backgroundColor: ['#9B5CF7', '#5B7CFA', '#17C3B2'],
      borderRadius: 8,
    },
  ],
}

const latencyData = {
  labels: ['Generation', 'Retrieval', 'Overhead'],
  datasets: [
    {
      label: 'ms',
      data: [483.83, 23.85, 140.04],
      backgroundColor: ['#EF4444', '#3B82F6', '#10B981'],
      borderRadius: 8,
    },
  ],
}

const hallucinationSeries = {
  labels: ['GPT (No RAG)', 'Basic RAG', 'Gemini', 'Level-3 RAG'],
  datasets: [
    {
      label: 'Hallucination Rate (%)',
      data: [35, 15, 12, 5],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37,99,235,0.08)',
      tension: 0.3,
      fill: true,
    },
  ],
}

export default function Insights() {
  const metricData = useMemo(() => sampleMetrics, [])

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
  }

  const bleuOptions = { ...commonOptions, scales: { y: { beginAtZero: true, max: 1 } } }
  const rougeOptions = { ...commonOptions, scales: { y: { beginAtZero: true, max: 1 } } }
  const latencyOptions = { ...commonOptions, indexAxis: 'y' }
  const halluOptions = {
    ...commonOptions,
    scales: { y: { beginAtZero: true, max: 40 } },
    animations: { tension: { duration: 900, easing: 'easeOutQuart' } },
  }

  const doughnutOptions = {
    ...commonOptions,
    animation: { ...(commonOptions.animation || {}), animateScale: true, animateRotate: true },
    plugins: { ...(commonOptions.plugins || {}), legend: { position: 'bottom' } },
  }

  return (
    <section>
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricChart title="Model Performance Metrics" metrics={metricData} width={720} height={340} />

        <div className="rounded-2xl bg-white/90 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Timing & Throughput</h3>
          <div className="mt-4 space-y-3">
            {timingSeries.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="text-sm text-slate-600">{t.name}</div>
                <div className="text-sm font-medium text-slate-800">{t.value} ms</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-700">Key Insights</h4>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>High precision/recall across the board (≈92%).</li>
              <li>Retrieval is very fast; generation is the main bottleneck.</li>
              <li>Low hallucination rate and strong faithfulness.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white/90 p-6 shadow-sm" style={{ height: 360 }}>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">BLEU Scores by Type</h3>
          <div style={{ height: 260 }}>
            <Bar data={bleuData} options={bleuOptions} />
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 p-6 shadow-sm" style={{ height: 360 }}>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">ROUGE Similarity Metrics</h3>
          <div style={{ height: 260 }}>
            <Bar data={rougeData} options={rougeOptions} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white/90 p-6 shadow-sm" style={{ height: 360 }}>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Latency Composition</h3>
          <div style={{ height: 220 }}>
            <Doughnut
              data={{ labels: ['Generation', 'Retrieval', 'Overhead'], datasets: [{ data: [483.83, 23.85, 140.04], backgroundColor: ['#EF4444', '#3B82F6', '#10B981'] }] }}
              options={doughnutOptions}
            />
          </div>
          <div className="mt-4 text-sm text-slate-600">System Throughput: ~0.02 QPS</div>
        </div>

        <div className="rounded-2xl bg-white/90 p-6 shadow-sm" style={{ height: 360 }}>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Hallucination Reduction Comparison</h3>
          <div style={{ height: 260 }}>
            <Line data={hallucinationSeries} options={halluOptions} />
          </div>
        </div>
      </div>
    </section>
  )
}
