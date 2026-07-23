import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function MyEarnings() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    api('/api/education/teacher/earnings')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">My earnings</h1>
      <p className="mb-6 text-sm text-gray-500">
        Read-only. WBS settles you after courses complete — you cannot mark yourself paid.
      </p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="text-gray-500">Loading…</div>}

      {data && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {['pending', 'settleable', 'settled'].map((k) => (
              <div key={k} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500">{k}</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{dollars(data.totals?.[k] || 0)}</div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.earnings || []).map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3">{e.session?.title || '—'}</td>
                    <td className="px-4 py-3">{dollars(e.amountCents)}</td>
                    <td className="px-4 py-3">{e.status}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!data.earnings?.length && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No earnings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
