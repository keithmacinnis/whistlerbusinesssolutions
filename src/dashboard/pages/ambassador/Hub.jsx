import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

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
