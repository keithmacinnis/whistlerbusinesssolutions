import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import BarChart from './BarChart'
import StatCard from './StatCard'

const LAST_SYNCED_KEY = 'wbs_website_behaviour_synced_at'

const number = (value) => Number(value || 0).toLocaleString()

const isWbsLabel = (label = '') => /whistlerbusinesssolutions/i.test(label)

const friendlySiteName = (label = '') => {
  if (isWbsLabel(label)) return 'Whistler Business Solutions'
  if (/birdnest/i.test(label)) return 'BirdNest Families'
  return label
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

function formatSyncedAt(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function siteTotals(site) {
  const days = site?.days || []
  return {
    uniques: days.reduce((a, d) => a + (d.uniques || 0), 0),
    pageviews: days.reduce((a, d) => a + (d.pageviews || 0), 0),
    requests: days.reduce((a, d) => a + (d.requests || 0), 0),
  }
}

function CloudflareBlock({ site, referers, showReferers }) {
  const totals = siteTotals(site)
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Edge traffic — Cloudflare</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Every unique client hitting the CDN (includes bots, crawlers, and asset requests).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Edge uniques" value={number(totals.uniques)} hint="unique clients at the edge" />
        <StatCard label="HTTP requests" value={number(totals.requests)} hint="all requests to the zone" />
        <StatCard
          label="HTML pageviews"
          value={number(totals.pageviews)}
          hint={totals.pageviews === 0 ? 'often 0 in zone analytics — use requests/uniques' : 'document-like responses'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Daily edge uniques</h4>
          {site.days?.length ? (
            <BarChart
              points={site.days.map((d) => ({ day: d.date, count: d.uniques }))}
              label="edge uniques"
            />
          ) : (
            <p className="text-sm text-gray-400">No Cloudflare data for this period.</p>
          )}
        </div>
        <RankedList
          title="Top countries"
          hint="by HTTP requests (not unique people)"
          rows={site.topCountries || []}
          labelKey="country"
          valueKey="requests"
          valueSuffix="req"
        />
      </div>

      {showReferers && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700">Referrer sources (Cloudflare RUM)</h4>
          {referers === null ? (
            <p className="mt-1 text-xs text-gray-400">
              Enable Cloudflare Web Analytics and set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_RUM_SITE_TAG
              for referrer sources.
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
    </div>
  )
}

function PostHogBlock({ data }) {
  if (!data) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Product analytics — PostHog</h3>
        <p className="mt-1 text-sm text-gray-400">Not connected for this site yet.</p>
      </div>
    )
  }
  if (!data.configured) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Product analytics — PostHog</h3>
        <p className="mt-1 text-sm text-gray-400">
          PostHog is not connected — set POSTHOG_DASHBOARD_KEY on the commerce server.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Product analytics — PostHog</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Real browsers that load the site with analytics enabled. Bots and many ad-blocked visits
          are excluded — expect much lower numbers than Cloudflare.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Visitors" value={number(data.summary.visitors)} hint="people with $pageview" />
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
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Daily visitors</h4>
        {data.days.length ? (
          <BarChart
            points={data.days.map((row) => ({ day: row.day, count: row.visitors }))}
            label="visitors"
          />
        ) : (
          <p className="text-sm text-gray-400">No PostHog traffic recorded for this period yet.</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <RankedList title="Top pages" rows={data.topPages} labelKey="path" valueKey="pageviews" valueSuffix="views" />
        <RankedList title="Traffic sources" rows={data.sources} labelKey="source" valueKey="visits" valueSuffix="views" />
        <RankedList title="Devices" rows={data.devices} labelKey="device" valueKey="visits" valueSuffix="views" />
      </div>
    </div>
  )
}

function SiteCard({ title, domainLabel, cloudflare, posthog, referers, showReferers }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-900">Website behaviour — {title}</h2>
        {domainLabel && domainLabel !== title && (
          <p className="mt-0.5 text-xs text-gray-400">{domainLabel}</p>
        )}
      </div>

      <div className="space-y-8">
        {cloudflare ? (
          <CloudflareBlock site={cloudflare} referers={referers} showReferers={showReferers} />
        ) : (
          <p className="text-sm text-gray-400">
            Cloudflare not connected for this site — set CLOUDFLARE_API_TOKEN on the server.
          </p>
        )}

        {(posthog || isWbsLabel(domainLabel) || isWbsLabel(title)) && (
          <>
            <div className="border-t border-gray-100" />
            <PostHogBlock data={posthog} />
          </>
        )}
      </div>
    </section>
  )
}

export default function WebsiteBehaviour() {
  const [days, setDays] = useState(7)
  const [cloudflare, setCloudflare] = useState(null)
  const [posthog, setPosthog] = useState(null)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncedAt, setSyncedAt] = useState(() => localStorage.getItem(LAST_SYNCED_KEY) || '')

  const load = useCallback(async () => {
    setSyncing(true)
    setError('')
    const errors = []
    const [cf, ph] = await Promise.all([
      api('/api/site/analytics', { params: { days } }).catch((err) => {
        errors.push(err.message)
        return { configured: false }
      }),
      api('/api/site/posthog-analytics', { params: { days } }).catch((err) => {
        errors.push(err.message)
        return null
      }),
    ])
    setCloudflare(cf)
    setPosthog(ph)
    if (errors.length) setError(errors.join(' · '))
    const now = new Date().toISOString()
    localStorage.setItem(LAST_SYNCED_KEY, now)
    setSyncedAt(now)
    setSyncing(false)
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const cards = useMemo(() => {
    const sites = cloudflare?.configured ? cloudflare.sites || [] : []
    const list = sites.map((site) => ({
      key: site.label,
      title: friendlySiteName(site.label),
      domainLabel: site.label,
      cloudflare: site,
      posthog: isWbsLabel(site.label) ? posthog : null,
      showReferers: isWbsLabel(site.label),
      referers: isWbsLabel(site.label) ? cloudflare?.referers ?? null : null,
    }))

    // If Cloudflare isn't on but PostHog is, still show the WBS card.
    if (!list.length && posthog) {
      list.push({
        key: 'wbs',
        title: 'Whistler Business Solutions',
        domainLabel: 'whistlerbusinesssolutions.com',
        cloudflare: null,
        posthog,
        showReferers: false,
        referers: null,
      })
    }
    return list
  }, [cloudflare, posthog])

  const syncedLabel = formatSyncedAt(syncedAt)

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Websites</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Edge traffic (Cloudflare) and product analytics (PostHog) per site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {syncedLabel && (
            <span className="text-xs text-gray-400">Last synced {syncedLabel}</span>
          )}
          <div className="flex rounded-md border border-gray-200 bg-white p-0.5">
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
          <button
            type="button"
            onClick={load}
            disabled={syncing}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : '↻ Sync'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {!cards.length && !error && (
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-400">
            {syncing
              ? 'Loading website analytics…'
              : 'No website analytics connected yet — set CLOUDFLARE_API_TOKEN and/or POSTHOG_DASHBOARD_KEY on the server.'}
          </p>
        </section>
      )}

      {cards.map((card) => (
        <SiteCard key={card.key} {...card} />
      ))}
    </div>
  )
}
