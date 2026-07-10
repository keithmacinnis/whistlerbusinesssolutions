import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { parseProductCsv } from '../../csv'

const EMPTY = { name: '', description: '', category: '', partnerName: '', partnerUrl: '', priceCents: '', commissionPct: '', kind: 'affiliate', network: '' }

const KINDS = [
  { value: 'affiliate', label: 'Affiliate', badge: 'bg-purple-100 text-purple-700' },
  { value: 'own_store', label: 'Our store', badge: 'bg-green-100 text-green-700' },
  { value: 'dropship', label: 'Dropship', badge: 'bg-blue-100 text-blue-700' },
]
const NETWORKS = ['', 'awin']
const STORE_URLS = {
  whistler: 'https://whistlerbusinesssolutions.com/shop.html',
  birdnest: 'https://birdnestfamilies.com/shop',
}

const dollars = (cents) => (cents == null ? '—' : `$${(cents / 100).toFixed(2)}`)

export default function ProductsTab({ business }) {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [form, setForm] = useState(EMPTY)
  const [csvPreview, setCsvPreview] = useState(null) // { products, errors }
  const [storePicker, setStorePicker] = useState(null) // null | { store, items }
  const fileRef = useRef()

  const reload = useCallback(() => {
    api(`/api/voice/businesses/${business.id}/products`)
      .then(({ products }) => setProducts(products))
      .catch((err) => setError(err.message))
  }, [business.id])

  useEffect(reload, [reload])

  const openEditor = (product) => {
    setEditing(product || 'new')
    setForm(
      product
        ? {
            ...EMPTY,
            name: product.name || '',
            description: product.description || '',
            category: product.category || '',
            partnerName: product.partnerName || '',
            partnerUrl: product.partnerUrl || '',
            priceCents: product.priceCents != null ? (product.priceCents / 100).toFixed(2) : '',
            commissionPct: product.commissionPct != null ? String(product.commissionPct) : '',
            kind: product.kind || 'affiliate',
            network: product.network || '',
          }
        : EMPTY
    )
  }

  const save = async () => {
    setError('')
    const body = {
      name: form.name,
      description: form.description || null,
      category: form.category || null,
      partnerName: form.partnerName || null,
      partnerUrl: form.partnerUrl,
      priceCents: form.priceCents === '' ? null : Math.round(parseFloat(form.priceCents) * 100),
      commissionPct: form.commissionPct === '' ? null : parseFloat(form.commissionPct),
      kind: form.kind,
      network: form.kind === 'affiliate' && form.network ? form.network : null,
    }
    try {
      if (editing === 'new') {
        await api(`/api/voice/businesses/${business.id}/products`, { method: 'POST', body })
      } else {
        await api(`/api/voice/products/${editing.id}`, { method: 'PATCH', body })
      }
      setEditing(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (product) => {
    if (!window.confirm(`Remove "${product.name}" from the catalog?`)) return
    try {
      await api(`/api/voice/products/${product.id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const onCsvPicked = async (file) => {
    const text = await file.text()
    setCsvPreview(parseProductCsv(text))
  }

  const openStorePicker = async (store) => {
    setError('')
    try {
      const { products: items } = await api('/api/commerce/products', { params: { store } })
      setStorePicker({ store, items })
    } catch (err) {
      setError(err.message)
    }
  }

  const addFromStore = async (item, store) => {
    try {
      await api(`/api/voice/businesses/${business.id}/products`, {
        method: 'POST',
        body: {
          name: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          partnerName: store === 'whistler' ? 'WBS Shop' : 'BirdNest Shop',
          partnerUrl: STORE_URLS[store],
          priceCents: item.priceCents,
          kind: 'own_store',
          merchProductId: item.id,
        },
      })
      setStorePicker(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const importCsv = async () => {
    try {
      await api(`/api/voice/businesses/${business.id}/products/import`, {
        method: 'POST',
        body: { products: csvPreview.products },
      })
      setCsvPreview(null)
      reload()
    } catch (err) {
      setError(err.body?.rows ? `${err.message}: rows ${err.body.rows.map((r) => r.row).join(', ')}` : err.message)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Affiliate products the agent can recommend. Callers get a tracked link; you earn the commission.
        </p>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files[0] && onCsvPicked(e.target.files[0])}
          />
          <button
            onClick={() => {
              fileRef.current.value = ''
              fileRef.current.click()
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Import CSV
          </button>
          <div className="relative">
            <select
              value=""
              onChange={(e) => e.target.value && openStorePicker(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="">Add from my store…</option>
              <option value="whistler">Whistler shop</option>
              <option value="birdnest">BirdNest shop</option>
            </select>
          </div>
          <button
            onClick={() => openEditor(null)}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Add product
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {products?.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
          No products yet. Add one or import a CSV with columns: name, partnerUrl, price, commissionPct.
        </div>
      )}

      {products?.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {p.category && <div className="text-xs text-gray-400">{p.category}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const k = KINDS.find((x) => x.value === (p.kind || 'affiliate')) || KINDS[0]
                      return (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${k.badge}`}>
                          {k.label}{p.network ? ` · ${p.network}` : ''}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.partnerName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{dollars(p.priceCents)}</td>
                  <td className="px-4 py-3 text-gray-600">{p.commissionPct != null ? `${p.commissionPct}%` : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditor(p)} className="text-sm text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => remove(p)} className="ml-3 text-sm text-red-600 hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add product' : 'Edit product'} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div className="flex gap-3">
              <label className="block flex-1 text-sm font-medium text-gray-700">
                Type
                <select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                >
                  {KINDS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </label>
              {form.kind === 'affiliate' && (
                <label className="block flex-1 text-sm font-medium text-gray-700">
                  Network
                  <select
                    value={form.network}
                    onChange={(e) => setForm({ ...form, network: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                  >
                    {NETWORKS.map((n) => (
                      <option key={n} value={n}>{n || 'direct / other'}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {[
              ['name', 'Name *'],
              ['partnerUrl', 'Partner / affiliate URL *'],
              ['partnerName', 'Partner name'],
              ['category', 'Category'],
              ['description', 'Description'],
              ['priceCents', 'Price (USD)'],
              ['commissionPct', 'Commission %'],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm font-medium text-gray-700">
                {label}
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                />
              </label>
            ))}
            <button
              onClick={save}
              disabled={!form.name.trim() || !form.partnerUrl.trim()}
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {storePicker && (
        <Modal
          title={`Add from ${storePicker.store === 'whistler' ? 'Whistler' : 'BirdNest'} shop`}
          onClose={() => setStorePicker(null)}
          wide
        >
          {storePicker.items.length === 0 && (
            <div className="text-sm text-gray-500">No active products in this store.</div>
          )}
          <div className="space-y-2">
            {storePicker.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-400">{dollars(item.priceCents)}</div>
                  </div>
                </div>
                <button
                  onClick={() => addFromStore(item, storePicker.store)}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {csvPreview && (
        <Modal title="Import products from CSV" onClose={() => setCsvPreview(null)} wide>
          {csvPreview.errors.length > 0 && (
            <div className="mb-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
              {csvPreview.errors.map((e) => (
                <div key={e.row}>Row {e.row}: {e.error}</div>
              ))}
            </div>
          )}
          {csvPreview.products.length > 0 && (
            <>
              <div className="mb-2 text-sm text-gray-600">{csvPreview.products.length} product(s) ready to import:</div>
              <div className="max-h-64 overflow-y-auto rounded border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">URL</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Comm %</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {csvPreview.products.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="max-w-48 truncate px-3 py-2 text-gray-500">{p.partnerUrl}</td>
                        <td className="px-3 py-2">{dollars(p.priceCents)}</td>
                        <td className="px-3 py-2">{p.commissionPct ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={importCsv}
                disabled={csvPreview.errors.length > 0}
                className="mt-4 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {csvPreview.errors.length > 0 ? 'Fix CSV errors to import' : `Import ${csvPreview.products.length} products`}
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
