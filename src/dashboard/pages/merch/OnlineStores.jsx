import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'

export default function OnlineStores() {
  const { user } = useAuth()
  const [websites, setWebsites] = useState(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', domain: '' })

  const reload = useCallback(() => {
    api('/api/commerce/admin/websites')
      .then(({ websites }) => setWebsites(websites))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const add = async () => {
    setError('')
    try {
      await api('/api/commerce/admin/websites', { method: 'POST', body: form })
      setAdding(false)
      setForm({ name: '', domain: '' })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleActive = async (w) => {
    try {
      await api(`/api/commerce/admin/websites/${w.id}`, { method: 'PATCH', body: { active: !w.active } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Commerce admin is limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Online Stores</h1>
        <button
          onClick={() => setAdding(true)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Website
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!websites && !error && <div className="text-gray-500">Loading…</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {websites?.map((w) => (
          <div key={w.id} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{w.name}</h2>
              <button
                onClick={() => toggleActive(w)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  w.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {w.active ? 'active' : 'off'}
              </button>
            </div>
            <a
              href={`https://${w.domain}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-sm text-brand-600 hover:underline"
            >
              {w.domain} ↗
            </a>
            <div className="mt-3 space-y-1 text-sm text-gray-500">
              <div>🛍 {w.merchCount} merch product{w.merchCount === 1 ? '' : 's'}</div>
              <div>🤝 {w.affiliateCount} affiliate product{w.affiliateCount === 1 ? '' : 's'}</div>
            </div>
            <Link
              to={`/merch/products?filter=web:${w.slug}`}
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              Manage products →
            </Link>
          </div>
        ))}
      </div>

      {adding && (
        <Modal title="Add website" onClose={() => setAdding(false)}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Name *
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Baby Gear Reviews"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Domain *
              <input
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="babygearreviews.com"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <p className="text-xs text-gray-400">
              New websites start as affiliate storefronts (Buy Direct products). Merch checkout with
              Printful fulfillment is currently available on the two original stores.
            </p>
            <button
              onClick={add}
              disabled={!form.name.trim() || !form.domain.trim()}
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Create website
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
