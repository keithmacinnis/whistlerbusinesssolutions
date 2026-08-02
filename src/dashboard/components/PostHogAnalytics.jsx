import { useEffect, useState } from 'react'
import { api } from '../api'
import BarChart from './BarChart'
import StatCard from './StatCard'

const number = (value) => Number(value || 0).toLocaleString()

function RankedList({ title, rows, labelKey, valueKey }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <div className="mt-2 space-y-1.5">
        {rows.slice(0, 6).map((row) => (
          <div key={row[labelKey]} className="flex gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate text-gray-600" title={row[labelKey]}>
              {row[labelKey]}
            </span>
            <span className="font-medium text-gray-900">{number(row[valueKey])}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
      </div>
    </div>
  )
}

export default function PostHogAnalytics() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    setError('')
    api('/api/site/posthog-analytics', { params: { days } })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [days])

  return (
    <section className="mt-8 rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Website behaviour — Whistler Business Solutions</h2>
          <p className="mt-0.5 text-xs text-gray-400">PostHog product analytics</p>
        </div>
        <div className="flex rounded-md border border-gray-200 p-0.5">
          {[7, 30].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                days === option ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && !error && <p className="text-sm text-gray-400">Loading PostHog analytics…</p>}
      {data && !data.configured && (
        <p className="text-sm text-gray-400">
          PostHog is not connected — set POSTHOG_DASHBOARD_KEY on the commerce server.
        </p>
      )}

      {data?.configured && (
        <div className="space-y-7">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Visitors" value={number(data.summary.visitors)} />
            <StatCard label="Sessions" value={number(data.summary.sessions)} />
            <StatCard label="Pageviews" value={number(data.summary.pageviews)} />
            <StatCard
              label="Booking clicks"
              value={number(data.summary.bookingClicks)}
              hint={`${data.summary.bookingClickRate}% of visitors`}
            />
            <StatCard label="Added to cart" value={number(data.summary.cartAdds)} />
            <StatCard label="Checkout starts" value={number(data.summary.checkoutStarts)} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Daily visitors</h3>
            {data.days.length ? (
              <BarChart
                points={data.days.map((row) => ({ day: row.day, count: row.visitors }))}
                label="visitors"
              />
            ) : (
              <p className="text-sm text-gray-400">No traffic has been recorded for this period yet.</p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <RankedList title="Top pages" rows={data.topPages} labelKey="path" valueKey="pageviews" />
            <RankedList title="Traffic sources" rows={data.sources} labelKey="source" valueKey="visits" />
            <RankedList title="Devices" rows={data.devices} labelKey="device" valueKey="visits" />
          </div>
        </div>
      )}
    </section>
  )
}
