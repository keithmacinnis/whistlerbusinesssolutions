import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function AmbassadorHub() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const reload = useCallback(() => {
    api('/api/ambassadors/me')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const primaryUrl =
    data?.shopUrl ||
    (data?.ambassador?.code
      ? `${data.referralBase || 'https://theadornlist.com'}/r/${data.ambassador.code}`
      : '')

  const copyPrimary = async () => {
    if (!primaryUrl) return
    await navigator.clipboard.writeText(primaryUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Your selling hub</h1>
      <p className="mb-6 text-sm text-gray-500">
        Share your links, track clicks and commissions, climb the family leaderboard.
      </p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="text-gray-500">Loading…</div>}

      {data && (
        <>
          <div className="mb-6 rounded-lg bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your shop link</div>
            <div className="mt-2 break-all font-mono text-sm text-gray-900">{primaryUrl}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyPrimary}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
              >
                {copied ? 'Copied!' : 'Copy my link'}
              </button>
              <Link
                to="/ambassador/links"
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              >
                All links &amp; QR codes
              </Link>
            </div>
            {data.month?.rank != null && (
              <p className="mt-3 text-sm text-gray-600">
                You&apos;re <span className="font-semibold">#{data.month.rank}</span> on the family board this month
                {data.month.rank === 1 ? ' — nice!' : '. Keep sharing!'}
              </p>
            )}
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
              <div className="text-sm font-semibold text-gray-900">QR codes</div>
              <div className="mt-1 text-xs text-gray-500">Download PNGs for your shop &amp; product links</div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
