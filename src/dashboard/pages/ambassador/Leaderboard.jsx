import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import { useAuth } from '../../auth'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function AmbassadorLeaderboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    const path =
      user?.role === 'super_admin'
        ? '/api/ambassadors/admin/leaderboard'
        : '/api/ambassadors/leaderboard'
    api(path)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [user?.role])

  useEffect(reload, [reload])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Family leaderboard</h1>
      <p className="mb-6 text-sm text-gray-500">Ranked by commission earned this calendar month.</p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="text-gray-500">Loading…</div>}

      {data && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data.rows || []).map((r) => {
                const mine = data.me?.ambassadorId === r.ambassadorId
                return (
                  <tr key={r.ambassadorId} className={mine ? 'bg-brand-50' : undefined}>
                    <td className="px-4 py-3 font-semibold">#{r.rank}</td>
                    <td className="px-4 py-3">
                      {r.displayName}
                      {mine && <span className="ml-2 text-xs text-brand-600">you</span>}
                    </td>
                    <td className="px-4 py-3">{r.orders}</td>
                    <td className="px-4 py-3 font-medium">{dollars(r.amountCents)}</td>
                  </tr>
                )
              })}
              {!data.rows?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No scores this month yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
