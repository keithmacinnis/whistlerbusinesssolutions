import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import BarChart from '../../components/BarChart'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`
const money = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

/** BirdNest weekly plan ≈ $2/week → ~$8/month per paying family. */
const BN_WEEKLY_USD = 2
const BN_MONTHLY_USD = BN_WEEKLY_USD * 4
const GOAL_USD = 1000
/** Recurring BirdNest share of the $1k example month. */
const BN_GOAL_SHARE = 0.8

/** Network programs — rates paid to WBS; sellers get networkSharePct of that. */
const AFFILIATE_NETWORKS = [
  {
    name: 'Bonheur Jewelry',
    network: 'Awin',
    rateLabel: '10% of sale',
    ratePct: 10,
    /** Example sale prices to show why jewelry $ commissions punch above % alone. */
    examples: [
      { label: '$180 earrings', saleUsd: 180 },
      { label: '$420 necklace', saleUsd: 420 },
      { label: '$890 bracelet', saleUsd: 890 },
    ],
  },
  {
    name: 'Booking.com',
    network: 'CJ',
    rateLabel: '~4% of booking value',
    ratePct: 4,
    note: 'Base accommodation tier; scales with volume',
    examples: [{ label: '$400 stay', saleUsd: 400 }],
  },
]

/** Own-store BirdNest baby clothes — sale vs supplier cost from live catalog. */
const OWN_STORE_EXAMPLES = [
  { label: 'Palm Tree Bloomer Set ($17.99)', netUsd: 6 },
  { label: 'AU Tiger Applique Set ($19.99)', netUsd: 6 },
  { label: 'Lily Floral Bubble ($15.99)', netUsd: 5 },
]

const VIRAL_TIERS = [
  {
    label: 'Modest hit',
    views: '25k views',
    visits: '250–750 visits',
    trials: '15–150 trials',
    paid: '5–40 paid',
    paidMid: 20,
  },
  {
    label: 'Real viral',
    views: '250k views',
    visits: '1.5k–7.5k visits',
    trials: '100–1,500 trials',
    paid: '30–400 paid',
    paidMid: 150,
  },
  {
    label: 'Breakout',
    views: '1M+ views',
    visits: 'Wide range',
    trials: 'Hundreds–thousands',
    paid: 'Hundreds+ paid',
    paidMid: 400,
  },
]

function pathToThousand(birdnestSharePct) {
  const share = Math.max(1, Number(birdnestSharePct) || 25) / 100
  const earnPerFamilyMo = BN_MONTHLY_USD * share
  const bnTargetUsd = Math.round(GOAL_USD * BN_GOAL_SHARE)
  const extraUsd = GOAL_USD - bnTargetUsd
  const familiesForBn = Math.ceil(bnTargetUsd / earnPerFamilyMo)
  const familiesSolo = Math.ceil(GOAL_USD / earnPerFamilyMo)
  return {
    sharePct: Math.round(share * 100),
    earnPerFamilyMo,
    bnTargetUsd,
    extraUsd,
    familiesForBn,
    familiesSolo,
  }
}

function MotivationCard({ sharePct, monthCents }) {
  const plan = pathToThousand(sharePct)
  const monthUsd = (monthCents || 0) / 100
  const progress = Math.min(100, Math.round((monthUsd / GOAL_USD) * 100))

  return (
    <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
      <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 px-5 py-6 sm:px-7 sm:py-7">
        <div className="text-xs font-semibold uppercase tracking-wide text-rose-700/80">
          Path to {money(GOAL_USD)} / month
        </div>
        <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Build recurring income with BirdNest
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
          Every family on the <span className="font-medium text-gray-800">$2/week</span> plan pays you about{' '}
          <span className="font-medium text-gray-800">{money(plan.earnPerFamilyMo)}/month</span> at your{' '}
          {plan.sharePct}% rate — and it keeps paying while they stay subscribed. Shops and Booking.com add
          on top.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-white/80 p-4 shadow-sm ring-1 ring-rose-100">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">BirdNest recurring</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {plan.familiesForBn.toLocaleString()}
              <span className="ml-1 text-base font-semibold text-gray-500">families</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              → about {money(plan.bnTargetUsd)}/mo from subscriptions
            </p>
          </div>
          <div className="rounded-lg bg-white/80 p-4 shadow-sm ring-1 ring-amber-100">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shops &amp; travel</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{money(plan.extraUsd)}</div>
            <p className="mt-1 text-sm text-gray-600">
              Adorn jewelry (big ticket = big $), baby clothes, Booking.com — on top of recurring
            </p>
          </div>
          <div className="rounded-lg bg-white/80 p-4 shadow-sm ring-1 ring-gray-200">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">This month</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{dollars(monthCents)}</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-rose-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">{progress}% of the way to {money(GOAL_USD)}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            What one viral post can do
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Rough ranges — views → visits → trials → paid (after the free month). Strong CTAs beat vanity views.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {VIRAL_TIERS.map((tier) => {
              const midRecurring = Math.round(tier.paidMid * plan.earnPerFamilyMo)
              return (
                <div
                  key={tier.label}
                  className="rounded-lg bg-white/90 p-4 shadow-sm ring-1 ring-gray-100"
                >
                  <div className="text-sm font-semibold text-gray-900">{tier.label}</div>
                  <div className="mt-0.5 text-lg font-bold text-gray-900">{tier.views}</div>
                  <ul className="mt-3 space-y-1 text-xs text-gray-600">
                    <li>{tier.visits}</li>
                    <li>{tier.trials}</li>
                    <li className="font-medium text-gray-800">{tier.paid}</li>
                  </ul>
                  <p className="mt-3 text-xs text-gray-500">
                    Mid-case ≈{' '}
                    <span className="font-semibold text-gray-800">{money(midRecurring)}/mo</span> recurring
                    if those paid stay subscribed
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-white/70 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
          <span className="font-semibold text-gray-900">Example month at goal:</span>{' '}
          {money(plan.bnTargetUsd)} BirdNest recurring ({plan.familiesForBn} active families) +{' '}
          {money(plan.extraUsd)} from shops &amp; Booking ={' '}
          <span className="font-semibold text-gray-900">{money(GOAL_USD)}</span>. All from subscriptions would
          take about {plan.familiesSolo.toLocaleString()} families.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/ambassador/links"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Share App Store &amp; shop links
          </Link>
          <Link
            to="/ambassador/earnings"
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            See earnings
          </Link>
        </div>
      </div>
    </div>
  )
}

function RateCard({ title, pct, accent, children }) {
  return (
    <div className={`rounded-lg bg-gradient-to-b ${accent} p-5 shadow-sm ring-1 ring-gray-100`}>
      <div className="text-4xl font-bold tracking-tight text-gray-900">{Number(pct ?? 0)}%</div>
      <div className="mt-2 text-sm font-semibold text-gray-900">{title}</div>
      {children}
    </div>
  )
}

function PlatformPulse({ pulse, loading, error }) {
  if (loading && !pulse) {
    return (
      <div className="mt-10 rounded-lg bg-white p-6 text-sm text-gray-400 shadow-sm ring-1 ring-gray-100">
        Loading platform pulse…
      </div>
    )
  }
  if (error && !pulse) {
    return (
      <div className="mt-10 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
    )
  }
  if (!pulse) return null

  const days = pulse.rangeDays || 30
  const trials = pulse.subscriptions?.activeTrials
  const subs = pulse.subscriptions?.activeSubscriptions
  const webTotal = pulse.website?.totalVisitors
  const appTotal = (pulse.appStore?.pageViews || []).reduce((s, p) => s + (p.count || 0), 0)

  return (
    <section className="mt-10 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
      <div className="border-b border-gray-100 bg-gradient-to-r from-sky-50 via-white to-rose-50 px-5 py-5 sm:px-7">
        <div className="text-xs font-semibold uppercase tracking-wide text-sky-800/80">
          BirdNest platform · last {days} days
        </div>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Where the attention is</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Live product pulse — website humans (PostHog), App Store page views, and who&apos;s on a trial or
          paid plan. Your shares of this pie show up in earnings when families convert through your links.
        </p>
      </div>

      <div className="grid gap-4 border-b border-gray-100 p-5 sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
        <div className="rounded-lg bg-rose-50/80 p-4 ring-1 ring-rose-100">
          <div className="text-xs font-medium uppercase tracking-wide text-rose-800/70">Active trials</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {pulse.subscriptions?.configured && trials != null ? Number(trials).toLocaleString() : '—'}
          </div>
          <p className="mt-1 text-xs text-gray-500">Free month in progress</p>
        </div>
        <div className="rounded-lg bg-amber-50/80 p-4 ring-1 ring-amber-100">
          <div className="text-xs font-medium uppercase tracking-wide text-amber-800/70">
            Active subscriptions
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {pulse.subscriptions?.configured && subs != null ? Number(subs).toLocaleString() : '—'}
          </div>
          <p className="mt-1 text-xs text-gray-500">Paying families right now</p>
        </div>
        <div className="rounded-lg bg-sky-50/80 p-4 ring-1 ring-sky-100">
          <div className="text-xs font-medium uppercase tracking-wide text-sky-800/70">
            Website humans
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {pulse.website?.configured && webTotal != null ? Number(webTotal).toLocaleString() : '—'}
          </div>
          <p className="mt-1 text-xs text-gray-500">birdnestfamilies.com · {days}d</p>
        </div>
        <div className="rounded-lg bg-violet-50/80 p-4 ring-1 ring-violet-100">
          <div className="text-xs font-medium uppercase tracking-wide text-violet-800/70">
            App Store views
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {pulse.appStore?.configured ? appTotal.toLocaleString() : '—'}
          </div>
          <p className="mt-1 text-xs text-gray-500">Product page · {days}d</p>
        </div>
      </div>

      {pulse.subscriptions?.error && (
        <div className="mx-5 mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:mx-7">
          Subscriptions: {pulse.subscriptions.error}
        </div>
      )}

      <div className="grid gap-6 p-5 sm:px-7 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Daily human visitors</h3>
          <p className="mt-0.5 text-xs text-gray-500">birdnestfamilies.com · PostHog (bots excluded)</p>
          <div className="mt-3">
            {!pulse.website?.configured ? (
              <p className="text-sm text-gray-400">Website analytics not connected.</p>
            ) : pulse.website.error ? (
              <p className="text-sm text-red-600">{pulse.website.error}</p>
            ) : (
              <BarChart
                points={pulse.website.dailyVisitors}
                label="visitors"
                barClassName="fill-sky-500"
              />
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">App Store page views</h3>
          <p className="mt-0.5 text-xs text-gray-500">BirdNest Baby Tracker listing · Apple Analytics</p>
          <div className="mt-3">
            {!pulse.appStore?.configured ? (
              <p className="text-sm text-gray-400">App Store Connect not connected.</p>
            ) : (
              <BarChart
                points={pulse.appStore.pageViews}
                label="page views"
                barClassName="fill-violet-500"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AmbassadorHub() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [pulse, setPulse] = useState(null)
  const [pulseError, setPulseError] = useState('')
  const [pulseLoading, setPulseLoading] = useState(true)

  const reload = useCallback(() => {
    api('/api/ambassadors/me')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  useEffect(() => {
    setPulseLoading(true)
    api('/api/ambassadors/me/platform-pulse', { params: { days: 30 } })
      .then(setPulse)
      .catch((err) => setPulseError(err.message))
      .finally(() => setPulseLoading(false))
  }, [])

  const rates = data?.rates || data?.ambassador || {}
  const networkShare = Number(rates.networkSharePct ?? 50)

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Your selling hub</h1>
      <p className="mb-6 text-sm text-gray-500">
        Share links, earn commissions, climb the family leaderboard.
      </p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="text-gray-500">Loading…</div>}

      {data && (
        <>
          {data.month?.rank != null && (
            <p className="mb-3 text-sm text-gray-600">
              Ranked <span className="font-semibold">#{data.month.rank}</span> this month
              {data.month.rank === 1 ? ' — nice!' : ''}
            </p>
          )}

          <div className="mb-3 grid gap-3 sm:grid-cols-4">
            {[
              ['This month', dollars(data.month?.amountCents)],
              ['Clicks', data.month?.clicks ?? 0],
              ['Orders', data.month?.orders ?? 0],
              ['Pending', dollars(data.totals?.pending)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <Link to="/ambassador/earnings" className="rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50">
              <div className="text-sm font-semibold text-gray-900">Earnings</div>
              <div className="mt-1 text-xs text-gray-500">
                Settleable {dollars(data.totals?.settleable)} · Paid {dollars(data.totals?.settled)}
              </div>
            </Link>
            <Link to="/ambassador/leaderboard" className="rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50">
              <div className="text-sm font-semibold text-gray-900">Leaderboard</div>
              <div className="mt-1 text-xs text-gray-500">This month&apos;s family rankings</div>
            </Link>
            <Link to="/ambassador/links" className="rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50">
              <div className="text-sm font-semibold text-gray-900">Links &amp; QR codes</div>
              <div className="mt-1 text-xs text-gray-500">Shops, App Store, Booking &amp; products</div>
            </Link>
          </div>

          <MotivationCard
            sharePct={rates.birdnestSharePct}
            monthCents={data.month?.amountCents}
          />

          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Your commission rates</h2>
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <RateCard
              title="BirdNest app subscriptions"
              pct={rates.birdnestSharePct}
              accent="from-rose-50 to-white"
            >
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Of each $2/week (or $89/year) payment attributed to you — about{' '}
                {money((BN_MONTHLY_USD * Number(rates.birdnestSharePct || 25)) / 100)}/mo per active weekly
                family.
              </p>
            </RateCard>

            <RateCard
              title="Affiliate sales"
              pct={rates.networkSharePct}
              accent="from-amber-50 to-white"
            >
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Of what each network pays us. Current programs:
              </p>
              <ul className="mt-2 space-y-2">
                {AFFILIATE_NETWORKS.map((n) => {
                  const youPct = (n.ratePct * networkShare) / 100
                  const youLabel =
                    youPct % 1 === 0 ? `${youPct}%` : `${youPct.toFixed(1)}%`
                  return (
                    <li key={n.name} className="rounded-md bg-white/70 px-2.5 py-2 ring-1 ring-amber-100/80">
                      <div className="text-xs font-semibold text-gray-900">
                        {n.name}{' '}
                        <span className="font-normal text-gray-400">({n.network})</span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        Network: {n.rateLabel} → you: ~{youLabel} of sale
                      </div>
                      {n.examples?.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5 text-[11px] text-gray-500">
                          {n.examples.map((ex) => {
                            const youUsd = (ex.saleUsd * youPct) / 100
                            return (
                              <li key={ex.label}>
                                {ex.label} →{' '}
                                <span className="font-semibold text-gray-800">
                                  ~${youUsd % 1 === 0 ? youUsd : youUsd.toFixed(0)} to you
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      {n.note && <div className="mt-1 text-[11px] text-gray-400">{n.note}</div>}
                    </li>
                  )
                })}
              </ul>
            </RateCard>

            <RateCard
              title="Own-store merch"
              pct={rates.ownStoreSharePct}
              accent="from-sky-50 to-white"
            >
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Of profit after cost on BirdNest shop clothes you send (sale − supplier).
              </p>
              <ul className="mt-2 space-y-0.5 rounded-md bg-white/70 px-2.5 py-2 text-[11px] text-gray-500 ring-1 ring-sky-100/80">
                {OWN_STORE_EXAMPLES.map((ex) => {
                  const youUsd = (ex.netUsd * Number(rates.ownStoreSharePct ?? 50)) / 100
                  return (
                    <li key={ex.label}>
                      {ex.label} →{' '}
                      <span className="font-semibold text-gray-800">
                        ~${youUsd % 1 === 0 ? youUsd : youUsd.toFixed(2)} to you
                      </span>
                    </li>
                  )
                })}
              </ul>
            </RateCard>
          </div>

          <PlatformPulse pulse={pulse} loading={pulseLoading} error={pulseError} />
        </>
      )}
    </div>
  )
}
