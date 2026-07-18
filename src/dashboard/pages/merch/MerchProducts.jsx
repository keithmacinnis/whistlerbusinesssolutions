import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import HoneydewImportModal from '../../components/HoneydewImportModal'
import { useAuth } from '../../auth'

const dollars = (cents) => (cents == null ? '—' : `$${(cents / 100).toFixed(2)}`)
const NETWORKS = ['', 'awin']

const TYPE_BADGES = {
  merch: 'bg-green-100 text-green-700',
  honeydew: 'bg-sky-100 text-sky-700',
  affiliate: 'bg-purple-100 text-purple-700',
  own_store: 'bg-green-100 text-green-700',
  dropship: 'bg-blue-100 text-blue-700',
}

export default function MerchProducts() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [websites, setWebsites] = useState([])
  const [centres, setCentres] = useState([])
  const [rows, setRows] = useState(null)
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  const [error, setError] = useState('')
  const [importer, setImporter] = useState(null) // { products, store }
  const [honeydewOpen, setHoneydewOpen] = useState(false)
  const [syncNote, setSyncNote] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [affiliateForm, setAffiliateForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const isAdmin = user?.role === 'super_admin'

  const reload = useCallback(async () => {
    setError('')
    try {
      const [{ websites: webs }, { businesses }] = await Promise.all([
        api('/api/commerce/admin/websites'),
        api('/api/voice/businesses'),
      ])
      setWebsites(webs)
      setCentres(businesses)

      const [{ products: merch }, webAff, ccProds] = await Promise.all([
        api('/api/commerce/admin/products'),
        Promise.all(
          webs.map((w) =>
            api(`/api/commerce/admin/websites/${w.id}/affiliate-products`, { params: { all: 'true' } }).then(
              ({ products }) => products.map((p) => ({ ...p, _web: w }))
            )
          )
        ),
        Promise.all(
          businesses.map((b) =>
            api(`/api/voice/businesses/${b.id}/products`, { params: { all: 'true' } }).then(({ products }) =>
              products.map((p) => ({ ...p, _cc: b }))
            )
          )
        ),
      ])

      const unified = [
        ...merch.map((p) => ({
          rowId: `m:${p.id}`,
          source: 'merch',
          owner: `web:${p.store}`,
          ownerLabel: webs.find((w) => w.slug === p.store)?.name || p.store,
          name: p.title,
          imageUrl: p.imageUrl,
          type: p.supplier === 'honeydew' ? 'honeydew' : 'merch',
          typeLabel: p.supplier === 'honeydew' ? 'Merch · Honeydew 🇺🇸' : 'Merch · Printful',
          detail: p.supplier === 'honeydew' && p.supplierPriceCents != null
            ? `cost ${dollars(p.supplierPriceCents)} · ${p.markupPct ?? 0}% markup`
            : null,
          priceCents: p.priceCents,
          commission: null,
          active: p.active,
          patchPath: `/api/commerce/admin/products/${p.id}`,
        })),
        ...webAff.flat().map((p) => ({
          rowId: `wa:${p.id}`,
          source: 'webaff',
          owner: `web:${p._web.slug}`,
          ownerLabel: p._web.name,
          name: p.name,
          imageUrl: p.imageUrl,
          type: 'affiliate',
          typeLabel: `Affiliate${p.network ? ` · ${p.network}` : ''}`,
          detail: p.partnerName,
          priceCents: p.priceCents,
          commission: p.commissionPct != null ? `${p.commissionPct}%` : null,
          active: p.active,
          patchPath: `/api/commerce/admin/affiliate-products/${p.id}`,
        })),
        ...ccProds.flat().map((p) => ({
          rowId: `cc:${p.id}`,
          source: 'ccprod',
          owner: `cc:${p._cc.id}`,
          ownerLabel: `📞 ${p._cc.name}`,
          name: p.name,
          imageUrl: p.imageUrl,
          type: p.kind || 'affiliate',
          typeLabel:
            (p.kind === 'own_store' ? 'Our store' : p.kind === 'dropship' ? 'Dropship' : 'Affiliate') +
            (p.network ? ` · ${p.network}` : ''),
          detail: p.partnerName,
          priceCents: p.priceCents,
          commission: p.commissionPct != null ? `${p.commissionPct}%` : null,
          active: p.active,
          patchPath: `/api/voice/products/${p.id}`,
        })),
      ]
      setRows(unified)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const toggleActive = async (row) => {
    try {
      await api(row.patchPath, { method: 'PATCH', body: { active: !row.active } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const openPrintful = async () => {
    setBusy(true)
    try {
      const { products } = await api('/api/commerce/admin/printful/products')
      setImporter({ products, store: filter.startsWith('web:') ? filter.slice(4) : 'birdnest' })
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
        body: { store: importer.store, syncProductId },
      })
      setImporter(null)
      reload()
      window.alert(`Imported ${result.imported} variant(s), skipped ${result.skipped}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const syncHoneydew = async () => {
    setSyncing(true)
    setSyncNote('')
    try {
      const { updated, deactivated, missing } = await api('/api/commerce/admin/honeydew/sync', { method: 'POST' })
      setSyncNote(`Honeydew sync: ${updated} updated, ${deactivated} deactivated, ${missing} gone from feed`)
      reload()
    } catch (err) {
      setSyncNote(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const openAffiliate = () => {
    setAffiliateForm({
      target: filter !== 'all' ? filter : websites[0] ? `web:${websites[0].slug}` : '',
      name: '', partnerUrl: '', partnerName: '', network: 'awin', priceCents: '', commissionPct: '',
    })
  }

  const saveAffiliate = async () => {
    const f = affiliateForm
    const body = {
      name: f.name,
      partnerUrl: f.partnerUrl,
      partnerName: f.partnerName || null,
      network: f.network || null,
      priceCents: f.priceCents === '' ? null : Math.round(parseFloat(f.priceCents) * 100),
      commissionPct: f.commissionPct === '' ? null : parseFloat(f.commissionPct),
    }
    try {
      if (f.target.startsWith('web:')) {
        const site = websites.find((w) => w.slug === f.target.slice(4))
        await api(`/api/commerce/admin/websites/${site.id}/affiliate-products`, { method: 'POST', body })
      } else {
        await api(`/api/voice/businesses/${f.target.slice(3)}/products`, {
          method: 'POST',
          body: { ...body, kind: 'affiliate' },
        })
      }
      setAffiliateForm(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isAdmin) return <div className="text-gray-500">Commerce admin is limited to super admins.</div>

  const visible = rows?.filter((r) => filter === 'all' || r.owner === filter)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          <button
            onClick={openPrintful}
            disabled={busy}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Import from Printful
          </button>
          <button
            onClick={() => setHoneydewOpen(true)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            🇺🇸 Import from Honeydew
          </button>
          <button
            onClick={syncHoneydew}
            disabled={syncing}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : '↻ Sync Honeydew'}
          </button>
          <button
            onClick={openAffiliate}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Add Affiliate
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {[{ key: 'all', label: 'All' },
          ...websites.map((w) => ({ key: `web:${w.slug}`, label: w.name })),
          ...centres.map((c) => ({ key: `cc:${c.id}`, label: `📞 ${c.name}` }))].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === f.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {syncNote && <div className="mb-4 rounded-md bg-sky-50 px-4 py-2 text-sm text-sky-700">{syncNote}</div>}
      {!rows && !error && <div className="text-gray-500">Loading…</div>}

      {visible?.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
          No products here yet. Import from Printful or add an affiliate product.
        </div>
      )}

      {visible?.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Where</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Visible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((r) => (
                <tr key={r.rowId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.imageUrl && <img src={r.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />}
                      <div className="font-medium text-gray-900">{r.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGES[r.type] || TYPE_BADGES.affiliate}`}>
                      {r.typeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.ownerLabel}</td>
                  <td className="px-4 py-3 text-gray-600">{r.detail || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{dollars(r.priceCents)}</td>
                  <td className="px-4 py-3 text-gray-600">{r.commission || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(r)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        r.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {r.active ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {importer && (
        <Modal title="Import Printful products" onClose={() => setImporter(null)} wide>
          <label className="mb-3 block text-sm font-medium text-gray-700">
            Into store
            <select
              value={importer.store}
              onChange={(e) => setImporter({ ...importer, store: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            >
              <option value="whistler">Whistler Business Solutions</option>
              <option value="birdnest">BirdNest Families</option>
            </select>
          </label>
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

      {honeydewOpen && (
        <HoneydewImportModal
          defaultStore={filter.startsWith('web:') ? filter.slice(4) : 'birdnest'}
          onClose={() => setHoneydewOpen(false)}
          onImported={(result) => {
            setHoneydewOpen(false)
            reload()
            window.alert(`Imported/updated ${result.imported} product(s), skipped ${result.skipped}.`)
          }}
        />
      )}

      {affiliateForm && (
        <Modal title="Add affiliate product" onClose={() => setAffiliateForm(null)}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Show on
              <select
                value={affiliateForm.target}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, target: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              >
                {websites.map((w) => (
                  <option key={w.slug} value={`web:${w.slug}`}>🌐 {w.name}</option>
                ))}
                {centres.map((c) => (
                  <option key={c.id} value={`cc:${c.id}`}>📞 {c.name}</option>
                ))}
              </select>
            </label>
            {[
              ['name', 'Product name *'],
              ['partnerUrl', 'Affiliate / deep link URL *'],
              ['partnerName', 'Brand (shown as "Sold by …")'],
              ['priceCents', 'Price (USD, optional)'],
              ['commissionPct', 'Commission %'],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm font-medium text-gray-700">
                {label}
                <input
                  value={affiliateForm[key]}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, [key]: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                />
              </label>
            ))}
            <label className="block text-sm font-medium text-gray-700">
              Network
              <select
                value={affiliateForm.network}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, network: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>{n || 'direct / other'}</option>
                ))}
              </select>
            </label>
            <button
              onClick={saveAffiliate}
              disabled={!affiliateForm.name.trim() || !affiliateForm.partnerUrl.trim() || !affiliateForm.target}
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Add product
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
