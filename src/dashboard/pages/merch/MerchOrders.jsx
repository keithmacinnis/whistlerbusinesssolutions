import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import StatusPill from '../../components/StatusPill'
import { useAuth } from '../../auth'

const STORES = ['', 'whistler', 'birdnest']
const STATUSES = ['pending', 'paid', 'fulfilled', 'failed', 'refunded']
const dollars = (cents) => (cents == null ? '—' : `$${(cents / 100).toFixed(2)}`)

export default function MerchOrders() {
  const { user } = useAuth()
  const [store, setStore] = useState('')
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    api('/api/commerce/admin/orders', { params: { store } })
      .then(({ orders }) => setOrders(orders))
      .catch((err) => setError(err.message))
  }, [store])

  useEffect(reload, [reload])

  const setStatus = async (order, status) => {
    try {
      await api(`/api/commerce/admin/orders/${order.id}`, { method: 'PATCH', body: { status } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Merch admin is limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Merch Orders</h1>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          {STORES.map((s) => (
            <option key={s} value={s}>{s === '' ? 'All stores' : s === 'whistler' ? 'Whistler' : 'BirdNest'}</option>
          ))}
        </select>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!orders && !error && <div className="text-gray-500">Loading…</div>}

      {orders?.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
          No orders yet.
        </div>
      )}

      {orders?.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.store}</td>
                  <td className="max-w-56 truncate px-4 py-3 text-gray-700">
                    {(o.items || []).map((i) => `${i.quantity}× ${i.title}`).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.customerEmail || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{dollars(o.amountCents)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusPill status={o.status} />
                      <select
                        value={o.status}
                        onChange={(e) => setStatus(o, e.target.value)}
                        className="rounded-md border border-gray-200 px-1 py-0.5 text-xs text-gray-600 focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
