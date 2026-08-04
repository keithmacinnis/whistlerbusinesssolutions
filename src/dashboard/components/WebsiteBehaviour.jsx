import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import BarChart from './BarChart'
import StatCard from './StatCard'

const CACHE_KEY = 'wbs_sites_apps_cache_v2'
const DAYS_KEY = 'wbs_sites_apps_days'

const number = (value) => Number(value || 0).toLocaleString()

/**
 * Curated properties — one card each.
 * Cloudflare zones matched by domain; PostHog projects are per-property
 * (WBS and BirdNest are separate free-tier accounts).
 */
const IGNORED_ZONE_MATCH = /birdnestteams/i

const PROPERTIES = [
  {
    id: 'wbs-web',
    title: 'Whistler Business Solutions',
    kind: 'website',
    domain: 'whistlerbusinesssolutions.com',
    match: /whistlerbusinesssolutions/i,
    posthog: true,
    posthogProject: 'wbs',
    posthogCache: 'posthogWbs',
    showCommerceEvents: true,
    rumReferers: true,
    sources: ['cloudflare', 'posthogWbs'],
  },
  {
    id: 'birdnest-web',
    title: 'BirdNest Families',
    kind: 'website',
    domain: 'birdnestfamilies.com',
    match: /birdnestfamilies/i,
    posthog: true,
    posthogProject: 'birdnest',
    posthogCache: 'posthogBirdnest',
    showCommerceEvents: false,
    sources: ['cloudflare', 'posthogBirdnest'],
  },
  {
    id: 'birdnest-app',
    title: 'BirdNest: Baby Tracker',
    kind: 'app',
    domain: 'iOS App Store',
    match: null,
    appMetrics: true,
    sources: ['appMetrics'],
  },
]

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') || {}
  } catch {
    return {}
  }
}

function writeCache(next) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(next))
}

function cacheSlot(cache, source, days) {
  // App metrics aren't range-scoped the same way; store under "all".
  const key = source === 'appMetrics' ? 'all' : String(days)
  return cache?.[source]?.[key] || null
}

function setCacheSlot(cache, source, days, data) {
  const key = source === 'appMetrics' ? 'all' : String(days)
  const syncedAt = new Date().toISOString()
  const next = {
    ...cache,
    [source]: {
      ...(cache[source] || {}),
      [key]: { data, syncedAt },
    },
  }
  writeCache(next)
  return { cache: next, syncedAt }
}

function formatSyncedAt(iso) {
  if (!iso) return 'Never synced'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Never synced'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function latestSyncedAt(isos) {
  const times = isos.filter(Boolean).map((iso) => new Date(iso).getTime()).filter((t) => !Number.isNaN(t))
  if (!times.length) return null
  return new Date(Math.max(...times)).toISOString()
}

function RankedList({ title, hint, rows, labelKey, valueKey, valueSuffix }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
      <div className="mt-2 space-y-1.5">
        {rows.slice(0, 6).map((row) => (
          <div key={row[labelKey]} className="flex gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate text-gray-600" title={row[labelKey]}>
              {row[labelKey]}
            </span>
            <span className="shrink-0 font-medium text-gray-900">
              {number(row[valueKey])}
              {valueSuffix ? (
                <span className="ml-1 text-xs font-normal text-gray-400">{valueSuffix}</span>
              ) : null}
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
      </div>
    </div>
  )
}

function siteTotals(site) {
  const days = site?.days || []
  return {
    uniques: days.reduce((a, d) => a + (d.uniques || 0), 0),
    pageviews: days.reduce((a, d) => a + (d.pageviews || 0), 0),
    requests: days.reduce((a, d) => a + (d.requests || 0), 0),
  }
}

function findCloudflareSite(sites, prop) {
  if (!prop.match || !sites?.length) return null
  return sites.find((s) => prop.match.test(s.label || '')) || null
}

function SyncControls({ syncing, onSync, lastSyncedAt, error }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onSync}
        disabled={syncing}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {syncing ? 'Syncing…' : '↻ Sync now'}
      </button>
      <span className="text-xs text-gray-400">Last synced {formatSyncedAt(lastSyncedAt)}</span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

function PropertyCard({
  prop,
  cloudflareSite,
  posthog,
  referers,
  appMetrics,
  days,
  lastSyncedAt,
  syncing,
  syncError,
  onSync,
  onSyncAppStore,
  appStoreSyncing,
  appSyncNote,
}) {
  const edge = cloudflareSite ? siteTotals(cloudflareSite) : null
  const humanVisitors = prop.posthog && posthog?.configured ? posthog.summary?.visitors : null
  const humanPageviews = prop.posthog && posthog?.configured ? posthog.summary?.pageviews : null
  const humanSessions = prop.posthog && posthog?.configured ? posthog.summary?.sessions : null

  const appPageViews = appMetrics?.appstore?.pageViews || []
  const appPageViewSum = appPageViews.reduce((a, p) => a + (p.count || 0), 0)
  const rcMetrics = appMetrics?.revenuecat?.configured ? appMetrics.revenuecat.metrics || [] : []
  const hasCachedData = Boolean(cloudflareSite || posthog || appMetrics)

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">
            {prop.kind === 'app' ? 'App' : 'Website'} — {prop.title}
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">{prop.domain}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {humanVisitors != null && (
            <div className="text-right">
              <div className="text-2xl font-semibold text-gray-900">{number(humanVisitors)}</div>
              <div className="text-xs text-gray-500">human visitors (PostHog, {days}d)</div>
            </div>
          )}
          <SyncControls
            syncing={syncing}
            onSync={onSync}
            lastSyncedAt={lastSyncedAt}
            error={syncError}
          />
        </div>
      </div>

      {!hasCachedData && !syncing && (
        <p className="mb-4 text-sm text-gray-400">No cached stats yet — hit Sync now to pull the latest.</p>
      )}

      <div className="mb-6 rounded-md bg-gray-50 px-4 py-3">
        {prop.kind === 'app' ? (
          <p className="text-sm text-gray-700">
            <span className="font-medium">Human reach:</span>{' '}
            {appMetrics?.appstore?.configured
              ? appPageViews.length
                ? `${number(appPageViewSum)} App Store product-page views in stored history (not the same as installs).`
                : 'App Store connected — no page-view rows yet (use Sync App Store report below).'
              : 'App Store Connect not connected — cannot measure product-page views yet.'}{' '}
            Subscription humans live in RevenueCat below.
          </p>
        ) : prop.posthog ? (
          posthog?.configured ? (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Human visitors: {number(humanVisitors)}</span>
              {' · '}
              {number(humanSessions)} sessions · {number(humanPageviews)} pageviews
              <span className="text-gray-500">
                {' '}
                — PostHog counts real browsers with analytics loaded; bots excluded.
              </span>
            </p>
          ) : (
            <p className="text-sm text-amber-800">
              <span className="font-medium">Human visitors: not available</span>
              {' — '}
              PostHog is not connected (set POSTHOG_DASHBOARD_KEY). Edge numbers include bots.
            </p>
          )
        ) : (
          <p className="text-sm text-amber-800">
            <span className="font-medium">Human visitors: not measured</span>
            {' — '}
            PostHog is not configured for this property.
          </p>
        )}
      </div>

      {prop.kind === 'website' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Edge traffic — Cloudflare</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Unique clients at the CDN — includes bots, crawlers, and asset requests. Not human visitor count.
            </p>
          </div>

          {!cloudflareSite ? (
            <p className="text-sm text-gray-400">No Cloudflare zone matched for {prop.domain}.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Edge uniques" value={number(edge.uniques)} hint="not humans — bots included" />
                <StatCard label="HTTP requests" value={number(edge.requests)} hint="all requests to the zone" />
                <StatCard
                  label="HTML pageviews"
                  value={number(edge.pageviews)}
                  hint={edge.pageviews === 0 ? 'zone metric often incomplete' : 'document-like responses'}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">Daily edge uniques</h4>
                  {cloudflareSite.days?.length ? (
                    <BarChart
                      points={cloudflareSite.days.map((d) => ({ day: d.date, count: d.uniques }))}
                      label="edge uniques"
                    />
                  ) : (
                    <p className="text-sm text-gray-400">No Cloudflare data for this period.</p>
                  )}
                </div>
                <RankedList
                  title="Top countries"
                  hint="by HTTP requests (not unique people)"
                  rows={cloudflareSite.topCountries || []}
                  labelKey="country"
                  valueKey="requests"
                  valueSuffix="req"
                />
              </div>

              {prop.rumReferers && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Referrer sources (Cloudflare RUM)</h4>
                  {referers == null ? (
                    <p className="mt-1 text-xs text-gray-400">
                      Enable Cloudflare Web Analytics and set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_RUM_SITE_TAG.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {(referers || []).slice(0, 5).map((r) => (
                        <div key={r.referer} className="flex justify-between text-sm">
                          <span className="truncate text-gray-600">{r.referer}</span>
                          <span className="font-medium text-gray-900">
                            {number(r.visits)}
                            <span className="ml-1 text-xs font-normal text-gray-400">visits</span>
                          </span>
                        </div>
                      ))}
                      {!referers?.length && <p className="text-sm text-gray-400">No referrer data yet.</p>}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {prop.posthog && posthog?.configured && (
            <>
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-800">Human behaviour — PostHog</h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  People who loaded the site with analytics. This is your real visitor count.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard label="Human visitors" value={number(posthog.summary.visitors)} hint="people with $pageview" />
                <StatCard label="Sessions" value={number(posthog.summary.sessions)} />
                <StatCard label="Pageviews" value={number(posthog.summary.pageviews)} />
                {prop.showCommerceEvents && (
                  <>
                    <StatCard
                      label="Booking clicks"
                      value={number(posthog.summary.bookingClicks)}
                      hint={`${posthog.summary.bookingClickRate}% of visitors`}
                    />
                    <StatCard label="Added to cart" value={number(posthog.summary.cartAdds)} />
                    <StatCard label="Checkout starts" value={number(posthog.summary.checkoutStarts)} />
                  </>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Daily human visitors</h4>
                {posthog.days?.length ? (
                  <BarChart
                    points={posthog.days.map((row) => ({ day: row.day, count: row.visitors }))}
                    label="human visitors"
                  />
                ) : (
                  <p className="text-sm text-gray-400">No PostHog traffic for this period yet.</p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <RankedList title="Top pages" rows={posthog.topPages || []} labelKey="path" valueKey="pageviews" valueSuffix="views" />
                <RankedList title="Traffic sources" rows={posthog.sources || []} labelKey="source" valueKey="visits" valueSuffix="views" />
                <RankedList title="Devices" rows={posthog.devices || []} labelKey="device" valueKey="visits" valueSuffix="views" />
              </div>
            </>
          )}
        </div>
      )}

      {prop.kind === 'app' && (
        <div className="space-y-5">
          {appMetrics?.appstore?.configured && onSyncAppStore && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onSyncAppStore}
                disabled={appStoreSyncing}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {appStoreSyncing ? 'Pulling report…' : '↻ Sync App Store report'}
              </button>
              <span className="text-xs text-gray-400">Pulls new ASC page-view rows into the DB</span>
            </div>
          )}
          {appSyncNote && (
            <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">{appSyncNote}</div>
          )}
          {!appMetrics ? (
            <p className="text-sm text-gray-400">No app metrics cached yet.</p>
          ) : (
            <>
              {appMetrics.revenuecat?.configured && !appMetrics.revenuecat.error && (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {rcMetrics.slice(0, 8).map((m) => (
                    <StatCard
                      key={m.id}
                      label={m.name}
                      value={
                        m.unit === '$' || /revenue|mrr/i.test(m.id)
                          ? `$${Number(m.value ?? 0).toLocaleString()}`
                          : number(m.value)
                      }
                      hint={m.period || undefined}
                    />
                  ))}
                </div>
              )}
              {appMetrics.revenuecat?.error && (
                <p className="text-sm text-red-600">{appMetrics.revenuecat.error}</p>
              )}
              {!appMetrics.revenuecat?.configured && (
                <p className="text-sm text-gray-400">RevenueCat not connected.</p>
              )}

              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">App Store page views</h4>
                {!appMetrics.appstore?.configured ? (
                  <p className="text-sm text-gray-400">App Store Connect not connected.</p>
                ) : appPageViews.length === 0 ? (
                  <p className="text-sm text-gray-400">No synced page-view data yet.</p>
                ) : (
                  <BarChart points={appPageViews} label="page views" />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default function WebsiteBehaviour() {
  const [days, setDays] = useState(() => {
    const saved = Number(localStorage.getItem(DAYS_KEY))
    return saved === 30 ? 30 : 7
  })
  const [cache, setCache] = useState(() => readCache())
  const [syncingId, setSyncingId] = useState(null)
  const [syncErrors, setSyncErrors] = useState({})
  const [appStoreSyncing, setAppStoreSyncing] = useState(false)
  const [appSyncNote, setAppSyncNote] = useState('')

  const cloudflare = cacheSlot(cache, 'cloudflare', days)?.data ?? null
  const appMetrics = cacheSlot(cache, 'appMetrics', days)?.data ?? null

  const syncedAtFor = useCallback(
    (sources) =>
      latestSyncedAt(
        sources.map((source) => cacheSlot(cache, source, days)?.syncedAt)
      ),
    [cache, days]
  )

  const changeDays = (next) => {
    setDays(next)
    localStorage.setItem(DAYS_KEY, String(next))
  }

  const syncSources = async (sources, propId) => {
    if (propId) setSyncingId(propId)
    if (propId) setSyncErrors((prev) => ({ ...prev, [propId]: '' }))
    let nextCache = readCache()
    const errors = []

    try {
      if (sources.includes('cloudflare')) {
        try {
          const data = await api('/api/site/analytics', { params: { days } })
          nextCache = setCacheSlot(nextCache, 'cloudflare', days, data).cache
        } catch (err) {
          errors.push(err.message)
        }
      }
      if (sources.includes('posthogWbs')) {
        try {
          const data = await api('/api/site/posthog-analytics', { params: { days, project: 'wbs' } })
          nextCache = setCacheSlot(nextCache, 'posthogWbs', days, data).cache
        } catch (err) {
          errors.push(err.message)
        }
      }
      if (sources.includes('posthogBirdnest')) {
        try {
          const data = await api('/api/site/posthog-analytics', {
            params: { days, project: 'birdnest' },
          })
          nextCache = setCacheSlot(nextCache, 'posthogBirdnest', days, data).cache
        } catch (err) {
          errors.push(err.message)
        }
      }
      if (sources.includes('appMetrics')) {
        try {
          const data = await api('/api/site/app-metrics')
          nextCache = setCacheSlot(nextCache, 'appMetrics', days, data).cache
        } catch (err) {
          errors.push(err.message)
        }
      }
      setCache(nextCache)
      if (propId && errors.length) {
        setSyncErrors((prev) => ({ ...prev, [propId]: errors.join(' · ') }))
      }
      return errors
    } finally {
      if (propId) setSyncingId(null)
    }
  }

  const syncCard = (prop) => syncSources(prop.sources, prop.id)

  const syncAppStoreReport = async () => {
    setAppStoreSyncing(true)
    setAppSyncNote('')
    try {
      const r = await api('/api/site/app-metrics/sync', { method: 'POST' })
      setAppSyncNote(
        r.note || (r.synced != null ? `Synced ${r.synced} day(s) from "${r.report}"` : 'Not configured')
      )
      const data = await api('/api/site/app-metrics')
      const result = setCacheSlot(readCache(), 'appMetrics', days, data)
      setCache(result.cache)
    } catch (err) {
      setAppSyncNote(err.message)
    } finally {
      setAppStoreSyncing(false)
    }
  }

  // First visit (or new range) with no cache: pull once so cards aren't blank.
  useEffect(() => {
    const hasAny =
      cacheSlot(cache, 'cloudflare', days) ||
      cacheSlot(cache, 'posthogWbs', days) ||
      cacheSlot(cache, 'posthogBirdnest', days) ||
      cacheSlot(cache, 'appMetrics', days)
    if (hasAny) return
    syncSources(['cloudflare', 'posthogWbs', 'posthogBirdnest', 'appMetrics'], null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot when this range has no cache
  }, [days])

  const cards = useMemo(() => {
    const sites = cloudflare?.configured ? cloudflare.sites || [] : []
    return PROPERTIES.map((prop) => {
      const cfSite = findCloudflareSite(sites, prop)
      const ph = prop.posthogCache ? cacheSlot(cache, prop.posthogCache, days)?.data ?? null : null
      return {
        prop,
        cloudflareSite: cfSite,
        posthog: prop.posthog ? ph : null,
        referers: prop.rumReferers ? cloudflare?.referers ?? null : null,
        appMetrics: prop.appMetrics ? appMetrics : null,
        lastSyncedAt: syncedAtFor(prop.sources),
      }
    })
  }, [cloudflare, appMetrics, cache, days, syncedAtFor])

  const unmatchedZones = useMemo(() => {
    const sites = cloudflare?.configured ? cloudflare.sites || [] : []
    return sites.filter(
      (s) =>
        !IGNORED_ZONE_MATCH.test(s.label || '') &&
        !PROPERTIES.some((p) => p.match && p.match.test(s.label || ''))
    )
  }, [cloudflare])

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Sites &amp; apps</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Showing last synced stats. Use Sync now on a card to refresh it. Human visitors = PostHog; Cloudflare = edge (bots included).
          </p>
        </div>
        <div className="flex rounded-md border border-gray-200 bg-white p-0.5">
          {[7, 30].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeDays(option)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                days === option ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      {cards.map((card) => (
        <PropertyCard
          key={card.prop.id}
          prop={card.prop}
          cloudflareSite={card.cloudflareSite}
          posthog={card.posthog}
          referers={card.referers}
          appMetrics={card.appMetrics}
          days={days}
          lastSyncedAt={card.lastSyncedAt}
          syncing={syncingId === card.prop.id}
          syncError={syncErrors[card.prop.id] || ''}
          onSync={() => syncCard(card.prop)}
          onSyncAppStore={card.prop.appMetrics ? syncAppStoreReport : undefined}
          appStoreSyncing={appStoreSyncing}
          appSyncNote={card.prop.appMetrics ? appSyncNote : ''}
        />
      ))}

      {unmatchedZones.length > 0 && (
        <p className="text-xs text-gray-400">
          Cloudflare zones not shown (unlisted): {unmatchedZones.map((z) => z.label).join(', ')}
        </p>
      )}
    </div>
  )
}
