import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`
const money = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

/** BirdNest weekly plan ≈ $2/week → ~$8/month per paying family. */
const BN_WEEKLY_USD = 2
const BN_MONTHLY_USD = BN_WEEKLY_USD * 4
const GOAL_USD = 1000
/** Share of the $1k goal we paint as recurring BN vs shop padding. */
const BN_GOAL_SHARE = 0.8

const RATE_CARDS = [
  {
    key: 'birdnestSharePct',
    title: 'BirdNest app subscriptions',
    blurb: 'Your cut of each BirdNest subscription payment attributed to you.',
    accent: 'from-rose-50 to-white',
  },
  {
    key: 'networkSharePct',
    title: 'Affiliate sales',
    blurb: 'Your share of network commissions (Awin, Booking.com, jewelry, and more).',
    accent: 'from-amber-50 to-white',
  },
  {
    key: 'ownStoreSharePct',
    title: 'Own-store merch',
    blurb: 'Your share of profit after cost on BirdNest / WBS shop orders you send.',
    accent: 'from-sky-50 to-white',
  },
]

function pathToThousand(birdnestSharePct) {
  const share = Math.max(1, Number(birdnestSharePct) || 25) / 100
  const earnPerFamilyMo = BN_MONTHLY_USD * share
  const bnTargetUsd = Math.round(GOAL_USD * BN_GOAL_SHARE)
  const shopPadUsd = GOAL_USD - bnTargetUsd
  const familiesForBn = Math.ceil(bnTargetUsd / earnPerFamilyMo)
  const familiesSolo = Math.ceil(GOAL_USD / earnPerFamilyMo)
  return {
    sharePct: Math.round(share * 100),
    earnPerFamilyMo,
    bnTargetUsd,
    shopPadUsd,
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
          Build recurring income with BirdNest — shops pad the rest
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
          Every family on the <span className="font-medium text-gray-800">$2/week</span> plan pays you about{' '}
          <span className="font-medium text-gray-800">{money(plan.earnPerFamilyMo)}/month</span> at your{' '}
          {plan.sharePct}% rate — and it keeps paying while they stay subscribed.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-white/80 p-4 shadow-sm ring-1 ring-rose-100 lg:col-span-1">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">The engine</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {plan.familiesForBn.toLocaleString()}
              <span className="ml-1 text-base font-semibold text-gray-500">families</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              → about {money(plan.bnTargetUsd)}/mo recurring from BirdNest
            </p>
          </div>
          <div className="rounded-lg bg-white/80 p-4 shadow-sm ring-1 ring-amber-100 lg:col-span-1">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">The padding</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{money(plan.shopPadUsd)}</div>
            <p className="mt-1 text-sm text-gray-600">
              Shops &amp; affiliates — baby clothes, Adorn jewelry, Booking.com
            </p>
          </div>
          <div className="rounded-lg bg-white/80 p-4 shadow-sm ring-1 ring-gray-200 lg:col-span-1">
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

        <div className="mt-5 rounded-lg bg-white/70 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
          <span className="font-semibold text-gray-900">Example month at goal:</span>{' '}
          {money(plan.bnTargetUsd)} BirdNest recurring ({plan.familiesForBn} active families) +{' '}
          {money(plan.shopPadUsd)} from shops &amp; booking links ={' '}
          <span className="font-semibold text-gray-900">{money(GOAL_USD)}</span>. All-recurring would take about{' '}
          {plan.familiesSolo.toLocaleString()} families — shops just help you get there sooner.
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

export default function AmbassadorHub() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    api('/api/ambassadors/me')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const rates = data?.rates || data?.ambassador || {}

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
          <MotivationCard
            sharePct={rates.birdnestSharePct}
            monthCents={data.month?.amountCents}
          />

          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Your commission rates</h2>
            {data.month?.rank != null && (
              <p className="text-sm text-gray-600">
                Ranked <span className="font-semibold">#{data.month.rank}</span> this month
                {data.month.rank === 1 ? ' — nice!' : ''}
              </p>
            )}
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {RATE_CARDS.map((card) => (
              <div
                key={card.key}
                className={`rounded-lg bg-gradient-to-b ${card.accent} p-5 shadow-sm ring-1 ring-gray-100`}
              >
                <div className="text-4xl font-bold tracking-tight text-gray-900">
                  {Number(rates[card.key] ?? 0)}%
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{card.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{card.blurb}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-4">
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

          <div className="grid gap-3 sm:grid-cols-3">
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
        </>
      )}
    </div>
  )
}
