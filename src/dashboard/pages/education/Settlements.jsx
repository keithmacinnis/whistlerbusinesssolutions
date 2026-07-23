import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function EducationSettlements() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [settle, setSettle] = useState(null)

  const reload = useCallback(() => {
    api('/api/education/admin/settlements')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const openSettle = (row) => {
    const earningIds = (data.earnings || [])
      .filter((e) => e.teacherId === row.teacherId)
      .map((e) => e.id)
    setSettle({
      teacherId: row.teacherId,
      teacherName: row.teacherName,
      amountCents: row.amountCents,
      earningIds,
      method: 'e-transfer',
      notes: '',
    })
  }

  const submit = async () => {
    setError('')
    try {
      await api('/api/education/admin/settlements', {
        method: 'POST',
        body: {
          teacherId: settle.teacherId,
          earningIds: settle.earningIds,
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
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Settlements</h1>
      <p className="mb-6 text-sm text-gray-500">
        Record payouts you make to teachers after courses complete. This is bookkeeping only — money stays in Stripe.
      </p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="text-gray-500">Loading…</div>}

      {data && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Settleable now</h2>
          <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.settleable || []).map((row) => (
                  <tr key={row.teacherId}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.teacherName}</td>
                    <td className="px-4 py-3">{dollars(row.amountCents)}</td>
                    <td className="px-4 py-3 text-gray-500">{row.count}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openSettle(row)} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white">
                        Record payout
                      </button>
                    </td>
                  </tr>
                ))}
                {!data.settleable?.length && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nothing to settle</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">History</h2>
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.history || []).map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-3 text-gray-600">{new Date(h.settledAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{h.teacher?.user?.name || h.teacher?.user?.email}</td>
                    <td className="px-4 py-3">{dollars(h.amountCents)}</td>
                    <td className="px-4 py-3 text-gray-500">{h.method || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{h.notes || '—'}</td>
                  </tr>
                ))}
                {!data.history?.length && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No settlements yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {settle && (
        <Modal title={`Settle ${settle.teacherName}`} onClose={() => setSettle(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">
              Mark <strong>{dollars(settle.amountCents)}</strong> as paid to this teacher.
            </p>
            <label className="block">
              <span className="text-gray-600">Method</span>
              <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={settle.method} onChange={(e) => setSettle({ ...settle, method: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-gray-600">Notes</span>
              <textarea className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" rows={2} value={settle.notes} onChange={(e) => setSettle({ ...settle, notes: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSettle(null)} className="rounded-md px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={submit} className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white">Confirm settled</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
