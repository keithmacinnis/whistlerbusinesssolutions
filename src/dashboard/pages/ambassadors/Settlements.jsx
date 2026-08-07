import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function AmbassadorSettlements() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [settle, setSettle] = useState(null)

  const reload = useCallback(() => {
    api('/api/ambassadors/admin/settlements')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const submit = async () => {
    setError('')
    try {
      await api('/api/ambassadors/admin/settlements', {
        method: 'POST',
        body: {
          ambassadorId: settle.ambassadorId,
          method: settle.method,
          notes: settle.notes,
        },
      })
      setSettle(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Ambassador settlements</h1>
      <p className="mb-6 text-sm text-gray-500">
        Record Friday Venmo / e-transfer payouts. Bookkeeping only — you move the money yourself.
      </p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="text-gray-500">Loading…</div>}

      {data && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Settleable now</h2>
          <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Ambassador</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.outstanding || []).map((row) => (
                  <tr key={row.ambassador?.id || row.ambassadorId}>
                    <td className="px-4 py-3 font-medium">
                      {row.ambassador?.displayName || row.ambassador?.user?.email || '—'}
                    </td>
                    <td className="px-4 py-3">{dollars(row.amountCents)}</td>
                    <td className="px-4 py-3 text-gray-500">{row.count}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setSettle({
                            ambassadorId: row.ambassador?.id,
                            name: row.ambassador?.displayName,
                            amountCents: row.amountCents,
                            method: 'e-transfer',
                            notes: '',
                          })
                        }
                        className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Record payout
                      </button>
                    </td>
                  </tr>
                ))}
                {!data.outstanding?.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      Nothing to settle
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">History</h2>
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Ambassador</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.settlements || []).map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.settledAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {s.ambassador?.displayName || s.ambassador?.user?.email}
                    </td>
                    <td className="px-4 py-3">{dollars(s.amountCents)}</td>
                    <td className="px-4 py-3">{s.method || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {settle && (
        <Modal title={`Pay ${settle.name || 'ambassador'}`} onClose={() => setSettle(null)}>
          <p className="mb-3 text-sm text-gray-600">Amount: {dollars(settle.amountCents)}</p>
          <label className="block text-sm">
            Method
            <input
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              value={settle.method}
              onChange={(e) => setSettle({ ...settle, method: e.target.value })}
            />
          </label>
          <label className="mt-3 block text-sm">
            Notes
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              value={settle.notes}
              onChange={(e) => setSettle({ ...settle, notes: e.target.value })}
            />
          </label>
          <button
            type="button"
            onClick={submit}
            className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            Mark paid
          </button>
        </Modal>
      )}
    </div>
  )
}
