import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import StatCard from '../components/StatCard'
import StatusPill from '../components/StatusPill'
import { useAuth } from '../auth'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function Overview() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncNote, setSyncNote] = useState('')

  const load = () =>
    api('/api/voice/analytics/overview')
      .then(setData)
      .catch((err) => setError(err.message))

  useEffect(() => {
    load()
  }, [])

  const syncAffiliates = async () => {
    setSyncing(true)
    setSyncNote('')
    try {
      const { synced, configured } = await api('/api/voice/affiliate/sync', { method: 'POST' })
      if (!configured.length) {
        setSyncNote('No affiliate networks configured yet (set AWIN_API_TOKEN + AWIN_PUBLISHER_ID).')
      } else {
        setSyncNote(
          synced
            .map((s) => s.error || `${s.network}: ${s.imported} new, ${s.updated} updated, ${s.unmatched} unmatched`)
            .join(' · ')
        )
        load()
      }
    } catch (err) {
      setSyncNote(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const totals = data?.businesses?.reduce(
    (acc, b) => ({
      calls: acc.calls + b.calls,
      clicks: acc.clicks + b.referralClicks,
      conversions: acc.conversions + b.conversions,
      commissionCents: acc.commissionCents + b.commissionCents,
    }),
    { calls: 0, clicks: 0, conversions: 0, commissionCents: 0 }
  )

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Last 30 days across your call centres.</p>
        </div>
        {user?.role === 'super_admin' && (
          <button
            onClick={syncAffiliates}
            disabled={syncing}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : '↻ Sync affiliate networks'}
          </button>
        )}
      </div>
      {syncNote && <div className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">{syncNote}</div>}

      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="mt-6 text-gray-500">Loading…</div>}

      {totals && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Calls" value={totals.calls} />
          <StatCard label="Referral clicks" value={totals.clicks} />
          <StatCard label="Conversions" value={totals.conversions} />
          <StatCard label="Earnings" value={dollars(totals.commissionCents)} />
        </div>
      )}

      {data?.businesses?.length === 0 && (
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-600">No call centres yet.</p>
          <Link to="/businesses/new" className="mt-2 inline-block text-brand-600 hover:underline">
            Create your first one →
          </Link>
        </div>
      )}

      {data?.businesses?.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Calls</th>
                <th className="px-4 py-3">Avg length</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Conv.</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.businesses.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/businesses/${b.id}`} className="font-medium text-brand-600 hover:underline">
                      {b.name}
                    </Link>
                    <div className="text-xs text-gray-400">{b.phoneNumber || 'No number'}</div>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{b.calls}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {b.avgDurationSeconds ? `${Math.floor(b.avgDurationSeconds / 60)}:${String(b.avgDurationSeconds % 60).padStart(2, '0')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.referralClicks}</td>
                  <td className="px-4 py-3 text-gray-700">{b.conversions}</td>
                  <td className="px-4 py-3 text-gray-700">{b.conversionRate}%</td>
                  <td className="px-4 py-3 text-gray-700">{dollars(b.commissionCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
