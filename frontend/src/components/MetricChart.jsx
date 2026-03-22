import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function MetricChart({ metrics = [], width = 720, height = 340, title }) {
  const labels = metrics.map((m) => m.label)
  const data = {
    labels,
    datasets: [
      {
        label: title || 'Score',
        data: metrics.map((m) => Math.round((m.value || 0) * 100 * 10) / 10),
        backgroundColor: metrics.map((m, i) => m.color || ['#FF9AA2', '#9BCBFF', '#BDF7C6', '#FFD59E'][i % 4]),
        borderRadius: 8,
        barPercentage: 0.6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      title: { display: !!title, text: title },
      tooltip: { enabled: true, mode: 'index', intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (v) => `${v}%` },
        grid: { drawBorder: false },
      },
      x: { grid: { display: false } },
    },
    elements: {
      bar: { borderRadius: 8, borderSkipped: false },
    },
  }

  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-sm" style={{ height: height }}>
      <div className="h-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
