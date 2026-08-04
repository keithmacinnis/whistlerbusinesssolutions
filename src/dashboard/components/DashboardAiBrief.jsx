import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`
const n = (v) => Number(v || 0).toLocaleString()

const fmtDuration = (seconds) => {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function siteTotals(site) {
  const days = site?.days || []
  return {
    uniques: days.reduce((a, d) => a + (d.uniques || 0), 0),
    pageviews: days.reduce((a, d) => a + (d.pageviews || 0), 0),
    requests: days.reduce((a, d) => a + (d.requests || 0), 0),
  }
}

function buildBrief({ generatedAt, voice, cloudflare, posthogWbs, posthogBirdnest, appMetrics, finance }) {
  const lines = []
  lines.push('# Whistler Business Solutions — dashboard snapshot')
  lines.push(`Generated: ${generatedAt}`)
  lines.push('')
  lines.push(
    'Context for AI agents: Cloudflare edge uniques include bots/crawlers/assets. PostHog counts real browsers with JS analytics (bots and many ad-blocked visits excluded). Money amounts are USD.'
  )
  lines.push('')

  // Call centres
  lines.push('## Call centres (last 30 days)')
  const businesses = voice?.businesses || []
  if (!businesses.length) {
    lines.push('No call centres.')
  } else {
    const totals = businesses.reduce(
      (acc, b) => ({
        calls: acc.calls + b.calls,
        clicks: acc.clicks + b.referralClicks,
        conversions: acc.conversions + b.conversions,
        commissionCents: acc.commissionCents + b.commissionCents,
        callCostCents: acc.callCostCents + (b.callCostCents || 0),
        netCents: acc.netCents + (b.netCents || 0),
      }),
      { calls: 0, clicks: 0, conversions: 0, commissionCents: 0, callCostCents: 0, netCents: 0 }
    )
    lines.push(
      `Totals: ${totals.calls} calls · ${totals.clicks} referral clicks · ${totals.conversions} conversions · earnings ${dollars(totals.commissionCents)} · call cost ${dollars(totals.callCostCents)} · net ${dollars(totals.netCents)}`
    )
    lines.push('')
    for (const b of businesses) {
      lines.push(`### ${b.name} (${b.status})`)
      lines.push(`- Phone: ${b.phoneNumber || 'none'}`)
      lines.push(
        `- Calls: ${b.calls} · avg length ${fmtDuration(b.avgDurationSeconds)} · clicks ${b.referralClicks} · conversions ${b.conversions} (${b.conversionRate}%)`
      )
      lines.push(
        `- Earnings ${dollars(b.commissionCents)} · call cost ${dollars(b.callCostCents)} · net ${dollars(b.netCents)}`
      )
      lines.push('')
    }
  }

  // Websites / apps
  const rangeDays =
    cloudflare?.rangeDays || posthogWbs?.rangeDays || posthogBirdnest?.rangeDays || 7
  lines.push(`## Sites & apps (last ${rangeDays} days)`)
  lines.push(
    'Note: Cloudflare edge uniques include bots. Human website visitors come from PostHog (WBS and BirdNest are separate projects).'
  )
  const sites = cloudflare?.configured ? cloudflare.sites || [] : []
  const catalog = [
    {
      title: 'Whistler Business Solutions',
      match: /whistlerbusinesssolutions/i,
      posthog: posthogWbs,
    },
    {
      title: 'BirdNest Families',
      match: /birdnestfamilies/i,
      posthog: posthogBirdnest,
    },
  ]
  let anySite = false
  for (const item of catalog) {
    const site = sites.find((s) => item.match.test(s.label || ''))
    const t = site ? siteTotals(site) : { uniques: 0, pageviews: 0, requests: 0 }
    if (item.hideIfEmpty && !t.requests && !t.uniques) continue
    anySite = true
    lines.push(`### ${item.title}${site ? ` (${site.label})` : ''}`)
    if (site) {
      lines.push(
        `- Cloudflare edge: ${n(t.uniques)} unique clients · ${n(t.requests)} HTTP requests · ${n(t.pageviews)} HTML pageviews`
      )
      if (site.topCountries?.length) {
        lines.push(
          `- Top countries by HTTP requests: ${site.topCountries
            .slice(0, 5)
            .map((c) => `${c.country} ${n(c.requests)} req`)
            .join(' · ')}`
        )
      }
    } else {
      lines.push('- Cloudflare: no matching zone')
    }
    if (item.posthog?.configured) appendPosthog(lines, item.posthog)
    else if (item.posthog && item.posthog.configured === false) {
      lines.push('- Human visitors (PostHog): not connected')
    } else {
      lines.push('- Human visitors (PostHog): not loaded')
    }
    lines.push('')
  }
  if (!anySite && (posthogWbs?.configured || posthogBirdnest?.configured)) {
    if (posthogWbs?.configured) {
      lines.push('### Whistler Business Solutions')
      lines.push('- Cloudflare: not connected')
      appendPosthog(lines, posthogWbs)
      lines.push('')
    }
    if (posthogBirdnest?.configured) {
      lines.push('### BirdNest Families')
      lines.push('- Cloudflare: not connected')
      appendPosthog(lines, posthogBirdnest)
      lines.push('')
    }
  }
  if (!anySite && !posthogWbs?.configured && !posthogBirdnest?.configured) {
    lines.push('No website analytics connected.')
    lines.push('')
  }
  if (cloudflare?.referers?.length) {
    lines.push(
      `Cloudflare RUM referrers: ${cloudflare.referers
        .slice(0, 5)
        .map((r) => `${r.referer} (${n(r.visits)} visits)`)
        .join(' · ')}`
    )
    lines.push('')
  }

  // App
  lines.push('## App performance — BirdNest Families')
  if (!appMetrics) {
    lines.push('App metrics not loaded.')
  } else {
    if (!appMetrics.revenuecat?.configured) {
      lines.push('RevenueCat: not connected')
    } else if (appMetrics.revenuecat.error) {
      lines.push(`RevenueCat error: ${appMetrics.revenuecat.error}`)
    } else {
      const metrics = appMetrics.revenuecat.metrics || []
      if (!metrics.length) lines.push('RevenueCat: no metrics')
      for (const m of metrics.slice(0, 10)) {
        const value =
          m.unit === '$' || /revenue|mrr/i.test(m.id)
            ? `$${Number(m.value ?? 0).toLocaleString()}`
            : n(m.value)
        lines.push(`- ${m.name}: ${value}${m.period ? ` (${m.period})` : ''}`)
      }
    }
    if (!appMetrics.appstore?.configured) {
      lines.push('App Store Connect: not connected')
    } else {
      const views = appMetrics.appstore.pageViews || []
      const sum = views.reduce((a, p) => a + (p.count || 0), 0)
      lines.push(
        views.length
          ? `App Store page views: ${n(sum)} across ${views.length} day(s) stored`
          : 'App Store page views: none synced yet'
      )
    }
  }
  lines.push('')

  // Finance
  lines.push('## Finance (period profit & burn)')
  if (!finance) {
    lines.push('Finance summary not loaded.')
  } else {
    const from = finance.range?.from ? new Date(finance.range.from).toISOString().slice(0, 10) : '?'
    const to = finance.range?.to ? new Date(finance.range.to).toISOString().slice(0, 10) : '?'
    lines.push(`Range: ${from} → ${to}`)
    const t = finance.totals || {}
    lines.push(
      `Totals: revenue ${dollars(t.revenueCents)} · costs ${dollars(t.costCents)} · profit ${dollars(t.profitCents)} · ad burn ${dollars(t.adBurnCents)} · overdue bills ${t.overdueCount ?? 0} · due soon ${t.dueSoonCount ?? 0}`
    )
    if (finance.byProduct?.length) {
      lines.push('By product:')
      for (const p of finance.byProduct) {
        lines.push(
          `- ${p.id}: in ${dollars(p.revenueCents)} · out ${dollars(p.costCents)} · profit ${dollars(p.profitCents)}`
        )
      }
    }
    const costAds = (finance.accounts || []).filter((a) => a.direction === 'cost' && a.category === 'ads')
    if (costAds.length) {
      lines.push('Ad accounts (period amounts):')
      for (const a of costAds) {
        lines.push(
          `- ${a.name}: period ${dollars(a.periodCents)} · last paid ${a.lastAmountCents != null ? dollars(a.lastAmountCents) : '—'} · next due ${a.nextDueAt ? new Date(a.nextDueAt).toISOString().slice(0, 10) : '—'} · health ${a.paymentHealth}`
        )
      }
    }
    const streams = (finance.streams || []).filter((s) => s.amountCents || s.excludedFromTotal)
    if (streams.length) {
      lines.push('Synced streams:')
      for (const s of streams) {
        lines.push(
          `- ${s.label} (${s.direction}): ${dollars(s.amountCents)}${s.excludedFromTotal ? ' [excluded from period profit]' : ''}${s.note ? ` — ${s.note}` : ''}`
        )
      }
    }
  }
  lines.push('')
  lines.push('— end of dashboard snapshot —')
  return lines.join('\n')
}

function appendPosthog(lines, posthog) {
  const s = posthog.summary || {}
  lines.push(
    `- Human visitors (PostHog): ${n(s.visitors)} · ${n(s.sessions)} sessions · ${n(s.pageviews)} pageviews · ${n(s.bookingClicks)} booking clicks (${s.bookingClickRate ?? 0}% of visitors) · ${n(s.cartAdds)} cart adds · ${n(s.checkoutStarts)} checkout starts`
  )
  if (posthog.topPages?.length) {
    lines.push(
      `- Top pages: ${posthog.topPages
        .slice(0, 5)
        .map((p) => `${p.path} (${n(p.pageviews)} views)`)
        .join(' · ')}`
    )
  }
  if (posthog.sources?.length) {
    lines.push(
      `- Traffic sources: ${posthog.sources
        .slice(0, 5)
        .map((p) => `${p.source} (${n(p.visits)})`)
        .join(' · ')}`
    )
  }
}

export default function DashboardAiBrief({ voice, appMetrics }) {
  const [cloudflare, setCloudflare] = useState(null)
  const [posthogWbs, setPosthogWbs] = useState(null)
  const [posthogBirdnest, setPosthogBirdnest] = useState(null)
  const [finance, setFinance] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    Promise.all([
      api('/api/site/analytics', { params: { days: 7 } }).catch(() => ({ configured: false })),
      api('/api/site/posthog-analytics', { params: { days: 7, project: 'wbs' } }).catch(() => null),
      api('/api/site/posthog-analytics', { params: { days: 7, project: 'birdnest' } }).catch(() => null),
      api('/api/finance/summary', { params: { range: 'month' } }).catch(() => null),
    ]).then(([cf, phWbs, phBn, fin]) => {
      setCloudflare(cf)
      setPosthogWbs(phWbs)
      setPosthogBirdnest(phBn)
      setFinance(fin)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const text = useMemo(
    () =>
      buildBrief({
        generatedAt: new Date().toISOString(),
        voice,
        cloudflare,
        posthogWbs,
        posthogBirdnest,
        appMetrics,
        finance,
      }),
    [voice, cloudflare, posthogWbs, posthogBirdnest, appMetrics, finance]
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the textarea
      const el = document.getElementById('wbs-ai-brief')
      if (el) {
        el.focus()
        el.select()
      }
    }
  }

  return (
    <section className="mt-10 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">AI brief</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Plain-text snapshot of this dashboard — copy/paste into agents for context.
            {loading ? ' Refreshing…' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={copy}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            {copied ? 'Copied' : 'Copy for AI'}
          </button>
        </div>
      </div>
      <textarea
        id="wbs-ai-brief"
        readOnly
        value={text}
        rows={16}
        className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-gray-800"
        onFocus={(e) => e.target.select()}
      />
    </section>
  )
}
