import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'

const MAX_CTA_SLOTS = 10

const CTA_SLOT_META = [
  { n: 1, name: 'Primary' },
  { n: 2, name: 'Secondary' },
  { n: 3, name: 'Tertiary' },
  { n: 4, name: 'Quaternary' },
  { n: 5, name: 'Quinary' },
  { n: 6, name: 'Senary' },
  { n: 7, name: 'Septenary' },
  { n: 8, name: 'Octonary' },
  { n: 9, name: 'Nonary' },
  { n: 10, name: 'Decenary' },
]

export default function OnlineStores() {
  const { user } = useAuth()
  const [websites, setWebsites] = useState(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', domain: '' })
  const [savingCta, setSavingCta] = useState(null)
  // Extra visible slots beyond saved length (per website). Default UI shows 1.
  const [visibleSlots, setVisibleSlots] = useState({})

  const reload = useCallback(() => {
    api('/api/commerce/admin/websites')
      .then(({ websites }) => setWebsites(websites))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const slotCountFor = (w) => {
    const saved = Array.isArray(w.ctaProductIds) ? w.ctaProductIds.length : 0
    const local = visibleSlots[w.id]
    return Math.min(MAX_CTA_SLOTS, Math.max(1, saved, local || 1))
  }

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

  const saveCtaSlots = async (w, ids) => {
    setError('')
    setSavingCta(w.id)
    try {
      await api(`/api/commerce/admin/websites/${w.id}`, {
        method: 'PATCH',
        body: { ctaProductIds: ids },
      })
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingCta(null)
    }
  }

  const setSlotProduct = (w, index, productId) => {
    const count = slotCountFor(w)
    const ids = Array.from({ length: count }, (_, i) => w.ctaProductIds?.[i] || null)
    ids[index] = productId || null
    saveCtaSlots(w, ids)
  }

  const addSlot = (w) => {
    const next = Math.min(MAX_CTA_SLOTS, slotCountFor(w) + 1)
    setVisibleSlots((prev) => ({ ...prev, [w.id]: next }))
  }

  const removeLastSlot = (w) => {
    const count = slotCountFor(w)
    if (count <= 1) return
    const ids = Array.from({ length: count - 1 }, (_, i) => w.ctaProductIds?.[i] || null)
    setVisibleSlots((prev) => ({ ...prev, [w.id]: count - 1 }))
    saveCtaSlots(w, ids)
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
        {websites?.map((w) => {
          const slotCount = slotCountFor(w)
          return (
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

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-end gap-1">
                  {slotCount > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLastSlot(w)}
                      disabled={savingCta === w.id}
                      className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      title="Remove last CTA slot"
                    >
                      −
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => addSlot(w)}
                    disabled={savingCta === w.id || slotCount >= MAX_CTA_SLOTS || !(w.affiliateProducts?.length)}
                    className="rounded border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    title="Add CTA slot"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-3">
                  {CTA_SLOT_META.slice(0, slotCount).map((slot, index) => (
                    <label key={slot.n} className="block text-sm font-medium text-gray-700">
                      {slot.name} CTA
                      <span className="ml-1 font-normal text-gray-400">cta-{slot.n}</span>
                      <select
                        value={w.ctaProductIds?.[index] || ''}
                        disabled={savingCta === w.id || !(w.affiliateProducts?.length)}
                        onChange={(e) => setSlotProduct(w, index, e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-gray-50"
                      >
                        <option value="">None — use site default</option>
                        {(w.affiliateProducts || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}{p.active === false ? ' (hidden from shop)' : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Slot 1 drives primary stay buttons. Slots 2–5 map to Flights, Cars, Attractions, and Gift Cards on the plan section.
                  Products marked Hidden still appear here for CTA use; they just stay off the shop.
                  {!w.affiliateProducts?.length && ' Add an affiliate product first.'}
                </p>
              </div>

              <Link
                to={`/merch/products?filter=web:${w.slug}`}
                className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Manage products →
              </Link>
            </div>
          )
        })}
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
              New websites start as affiliate storefronts (Select This Card products). Merch checkout with
              Printful fulfillment is currently available on the two original stores.
            </p>
            <button
              onClick={add}
              disabled={!form.name.trim() || !form.domain.trim()}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Create website
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
