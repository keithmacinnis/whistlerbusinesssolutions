import { useEffect, useState } from 'react'
import { api } from '../../api'
import StatCard from '../../components/StatCard'
import BarChart from '../../components/BarChart'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function OverviewTab({ business }) {
  const [summary, setSummary] = useState(null)
  const [series, setSeries] = useState(null)
  const [metric, setMetric] = useState('calls')
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/api/voice/businesses/${business.id}/analytics/summary`)
      .then(setSummary)
      .catch((err) => setError(err.message))
  }, [business.id])

  useEffect(() => {
    api(`/api/voice/businesses/${business.id}/analytics/timeseries`, { params: { metric } })
      .then(setSeries)
      .catch((err) => setError(err.message))
  }, [business.id, metric])

  if (error) return <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
  if (!summary) return <div className="text-gray-500">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Calls (30d)" value={summary.calls} />
        <StatCard
          label="Avg call length"
          value={summary.avgDurationSeconds ? `${Math.floor(summary.avgDurationSeconds / 60)}:${String(summary.avgDurationSeconds % 60).padStart(2, '0')}` : '—'}
        />
        <StatCard label="Referral clicks" value={summary.referralClicks} />
        <StatCard label="Conversions" value={summary.conversions} hint={`${summary.conversionRate}% of clicks`} />
        <StatCard label="Commission" value={dollars(summary.commissionCents)} />
      </div>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Daily activity</h2>
          <div className="flex gap-1">
            {['calls', 'clicks', 'conversions'].map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-md px-3 py-1 text-sm ${
                  metric === m ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <BarChart points={series?.points} label={metric} />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Call outcomes</h2>
          <div className="mt-3 space-y-2">
            {Object.keys(summary.outcomes).length === 0 && (
              <div className="text-sm text-gray-400">No calls yet.</div>
            )}
            {Object.entries(summary.outcomes).map(([outcome, count]) => (
              <div key={outcome} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{outcome.replace(/_/g, ' ')}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Top products by clicks</h2>
          <div className="mt-3 space-y-2">
            {summary.topProducts.length === 0 && (
              <div className="text-sm text-gray-400">No referral clicks yet.</div>
            )}
            {summary.topProducts.map((p) => (
              <div key={p.product} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{p.product}</span>
                <span className="font-medium text-gray-900">{p.clicks}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
