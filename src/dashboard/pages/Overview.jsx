import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import StatCard from '../components/StatCard'
import StatusPill from '../components/StatusPill'
import BarChart from '../components/BarChart'
import ActionItems from '../components/ActionItems'
import { useAuth } from '../auth'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function Overview() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncNote, setSyncNote] = useState('')
  const [traffic, setTraffic] = useState(null)
  const [appMetrics, setAppMetrics] = useState(null)
  const [appSyncing, setAppSyncing] = useState(false)
  const [appSyncNote, setAppSyncNote] = useState('')
  const isAdmin = user?.role === 'super_admin'

  const load = () =>
    api('/api/voice/analytics/overview')
      .then(setData)
      .catch((err) => setError(err.message))

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    api('/api/site/analytics', { params: { days: 7 } })
      .then(setTraffic)
      .catch(() => setTraffic({ configured: false }))
    api('/api/site/app-metrics')
      .then(setAppMetrics)
      .catch(() => setAppMetrics(null))
  }, [isAdmin])

  const syncAppStore = async () => {
    setAppSyncing(true)
    setAppSyncNote('')
    try {
      const r = await api('/api/site/app-metrics/sync', { method: 'POST' })
      setAppSyncNote(
        r.note || (r.synced != null ? `Synced ${r.synced} day(s) from "${r.report}"` : 'Not configured')
      )
      api('/api/site/app-metrics').then(setAppMetrics).catch(() => {})
    } catch (err) {
      setAppSyncNote(err.message)
    } finally {
      setAppSyncing(false)
    }
  }

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

      {isAdmin && <ActionItems />}

      {isAdmin && appMetrics && (
        <section className="mt-8 rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">App performance — birdNest Families</h2>
            {appMetrics.appstore.configured && (
              <button
                onClick={syncAppStore}
                disabled={appSyncing}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {appSyncing ? 'Syncing…' : '↻ Sync App Store data'}
              </button>
            )}
          </div>
          {appSyncNote && <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">{appSyncNote}</div>}

          {!appMetrics.revenuecat.configured ? (
            <p className="text-sm text-gray-400">
              RevenueCat not connected — set REVENUECAT_API_V2_KEY (v2 secret with metrics read) and
              REVENUECAT_PROJECT_ID on the server for revenue &amp; subscriber stats.
            </p>
          ) : appMetrics.revenuecat.error ? (
            <p className="text-sm text-red-600">{appMetrics.revenuecat.error}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {(appMetrics.revenuecat.metrics || []).slice(0, 8).map((m) => (
                <StatCard
                  key={m.id}
                  label={m.name}
                  value={m.unit === '$' || /revenue|mrr/i.test(m.id) ? `$${Number(m.value ?? 0).toLocaleString()}` : Number(m.value ?? 0).toLocaleString()}
                  hint={m.period || undefined}
                />
              ))}
            </div>
          )}

          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">App Store page views</h3>
            {!appMetrics.appstore.configured ? (
              <p className="text-sm text-gray-400">
                App Store Connect not connected — set ASC_ISSUER_ID, ASC_KEY_ID, ASC_PRIVATE_KEY and
                ASC_APP_ID on the server.
              </p>
            ) : appMetrics.appstore.pageViews.length === 0 ? (
              <p className="text-sm text-gray-400">
                No data yet — hit Sync. Apple provisions analytics reports asynchronously, so the first
                data can take a few days to appear after the first sync.
              </p>
            ) : (
              <BarChart points={appMetrics.appstore.pageViews} label="page views" />
            )}
          </div>
        </section>
      )}

      {isAdmin && traffic && (
        <section className="mt-8 rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Site traffic (last 7 days)</h2>
            <span className="text-xs text-gray-400">via Cloudflare</span>
          </div>
          {!traffic.configured ? (
            <p className="text-sm text-gray-400">
              Not connected yet — set CLOUDFLARE_API_TOKEN (all zones) on the server to see visitors
              and traffic sources here.
            </p>
          ) : (
            <div className="space-y-8">
              {(traffic.sites || []).map((site) => (
                <div key={site.label} className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="font-medium text-gray-800">{site.label}</span>
                      <span className="text-sm text-gray-500">
                        {site.days.reduce((a, d) => a + d.uniques, 0).toLocaleString()} unique visitors ·{' '}
                        {site.days.reduce((a, d) => a + d.pageviews, 0).toLocaleString()} pageviews
                      </span>
                    </div>
                    <BarChart
                      points={site.days.map((d) => ({ day: d.date, count: d.uniques }))}
                      label="unique visitors"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Top countries</h3>
                    <div className="mt-1 space-y-1">
                      {site.topCountries.slice(0, 5).map((c) => (
                        <div key={c.country} className="flex justify-between text-sm">
                          <span className="text-gray-600">{c.country}</span>
                          <span className="text-gray-900">{c.requests.toLocaleString()}</span>
                        </div>
                      ))}
                      {site.topCountries.length === 0 && (
                        <div className="text-sm text-gray-400">No data yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Sources</h3>
                {traffic.referers === null ? (
                  <p className="mt-1 text-xs text-gray-400">
                    Enable Cloudflare Web Analytics (RUM) and set CLOUDFLARE_ACCOUNT_ID +
                    CLOUDFLARE_RUM_SITE_TAG for referrer sources.
                  </p>
                ) : (
                  <div className="mt-1 space-y-1">
                    {traffic.referers.slice(0, 5).map((r) => (
                      <div key={r.referer} className="flex justify-between text-sm">
                        <span className="truncate text-gray-600">{r.referer}</span>
                        <span className="text-gray-900">{r.visits.toLocaleString()}</span>
                      </div>
                    ))}
                    {traffic.referers.length === 0 && (
                      <div className="text-sm text-gray-400">No referrer data yet.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
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
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Net</th>
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
                  <td className="px-4 py-3 text-gray-700">{dollars(b.callCostCents)}</td>
                  <td className={`px-4 py-3 font-medium ${b.netCents >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {dollars(b.netCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
