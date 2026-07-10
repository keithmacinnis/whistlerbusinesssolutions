import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'

const STORES = ['whistler', 'birdnest']
const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function MerchProducts() {
  const { user } = useAuth()
  const [store, setStore] = useState('whistler')
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')
  const [importer, setImporter] = useState(null) // null | { products } from Printful
  const [busy, setBusy] = useState(false)

  const isAdmin = user?.role === 'super_admin'

  const reload = useCallback(() => {
    api('/api/commerce/admin/products', { params: { store } })
      .then(({ products }) => setProducts(products))
      .catch((err) => setError(err.message))
  }, [store])

  useEffect(reload, [reload])

  const toggleActive = async (p) => {
    try {
      await api(`/api/commerce/admin/products/${p.id}`, { method: 'PATCH', body: { active: !p.active } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const openPrintful = async () => {
    setError('')
    setBusy(true)
    try {
      const { products } = await api('/api/commerce/admin/printful/products')
      setImporter({ products })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const importProduct = async (syncProductId) => {
    setBusy(true)
    try {
      const result = await api('/api/commerce/admin/printful/import', {
        method: 'POST',
        body: { store, syncProductId },
      })
      setError('')
      setImporter(null)
      reload()
      window.alert(`Imported ${result.imported} variant(s), skipped ${result.skipped}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin) {
    return <div className="text-gray-500">Merch admin is limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Merch Products</h1>
        <button
          onClick={openPrintful}
          disabled={busy}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Import from Printful
        </button>
      </div>

      <div className="mb-4 flex gap-1">
        {STORES.map((s) => (
          <button
            key={s}
            onClick={() => setStore(s)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              store === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
            }`}
          >
            {s === 'whistler' ? 'Whistler' : 'BirdNest'}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!products && !error && <div className="text-gray-500">Loading…</div>}

      {products?.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
          No products in this store yet. Import from Printful to get started.
        </div>
      )}

      {products?.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Printful variant</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />}
                      <div>
                        <div className="font-medium text-gray-900">{p.title}</div>
                        <div className="text-xs text-gray-400">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{dollars(p.priceCents)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.printfulVariantId}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        p.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {importer && (
        <Modal title={`Import Printful products into ${store}`} onClose={() => setImporter(null)} wide>
          {importer.products.length === 0 && <div className="text-sm text-gray-500">No synced products found in Printful.</div>}
          <div className="space-y-2">
            {importer.products.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  {p.thumbnail_url && <img src={p.thumbnail_url} alt="" className="h-10 w-10 rounded object-cover" />}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.variants} variant(s)</div>
                  </div>
                </div>
                <button
                  onClick={() => importProduct(p.id)}
                  disabled={busy}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
