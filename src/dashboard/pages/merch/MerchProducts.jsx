import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import HoneydewImportModal from '../../components/HoneydewImportModal'
import { useAuth } from '../../auth'

const dollars = (cents) => (cents == null ? '—' : `$${(cents / 100).toFixed(2)}`)
const NETWORKS = ['', 'awin', 'cj']

const TYPE_BADGES = {
  merch: 'bg-green-100 text-green-700',
  honeydew: 'bg-sky-100 text-sky-700',
  affiliate: 'bg-purple-100 text-purple-700',
  own_store: 'bg-green-100 text-green-700',
  dropship: 'bg-blue-100 text-blue-700',
}

const EMPTY_AFFILIATE = {
  mode: 'create',
  target: '',
  name: '',
  description: '',
  imageUrl: '',
  partnerUrl: '',
  partnerName: '',
  network: 'awin',
  ctaLabel: '',
  priceCents: '',
  commissionPct: '',
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

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
  const [productForm, setProductForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [saving, setSaving] = useState(false)

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
          id: p.id,
          source: 'merch',
          owner: `web:${p.store}`,
          ownerLabel: webs.find((w) => w.slug === p.store)?.name || p.store,
          name: p.title,
          description: p.description || '',
          imageUrl: p.imageUrl,
          partnerUrl: '',
          partnerName: '',
          network: '',
          type: p.supplier === 'honeydew' ? 'honeydew' : 'merch',
          typeLabel: p.supplier === 'honeydew' ? 'Merch · Honeydew 🇺🇸' : 'Merch · Printful',
          detail: p.supplier === 'honeydew' && p.supplierPriceCents != null
            ? `cost ${dollars(p.supplierPriceCents)} · ${p.markupPct ?? 0}% markup`
            : null,
          priceCents: p.priceCents,
          commissionPct: null,
          commission: null,
          active: p.active,
          patchPath: `/api/commerce/admin/products/${p.id}`,
          editable: true,
        })),
        ...webAff.flat().map((p) => ({
          rowId: `wa:${p.id}`,
          id: p.id,
          source: 'webaff',
          owner: `web:${p._web.slug}`,
          ownerLabel: p._web.name,
          name: p.name,
          description: p.description || '',
          imageUrl: p.imageUrl,
          partnerUrl: p.partnerUrl || '',
          partnerName: p.partnerName || '',
          network: p.network || '',
          ctaLabel: p.ctaLabel || '',
          type: 'affiliate',
          typeLabel: `Affiliate${p.network ? ` · ${p.network}` : ''}`,
          detail: p.partnerName,
          priceCents: p.priceCents,
          commissionPct: p.commissionPct,
          commission: p.commissionPct != null ? `${p.commissionPct}%` : null,
          active: p.active,
          patchPath: `/api/commerce/admin/affiliate-products/${p.id}`,
          editable: true,
        })),
        ...ccProds.flat().map((p) => ({
          rowId: `cc:${p.id}`,
          id: p.id,
          source: 'ccprod',
          owner: `cc:${p._cc.id}`,
          ownerLabel: `📞 ${p._cc.name}`,
          name: p.name,
          description: p.description || '',
          imageUrl: p.imageUrl,
          partnerUrl: p.partnerUrl || '',
          partnerName: p.partnerName || '',
          network: p.network || '',
          ctaLabel: p.ctaLabel || '',
          type: p.kind || 'affiliate',
          typeLabel:
            (p.kind === 'own_store' ? 'Our store' : p.kind === 'dropship' ? 'Dropship' : 'Affiliate') +
            (p.network ? ` · ${p.network}` : ''),
          detail: p.partnerName,
          priceCents: p.priceCents,
          commissionPct: p.commissionPct,
          commission: p.commissionPct != null ? `${p.commissionPct}%` : null,
          active: p.active,
          patchPath: `/api/voice/products/${p.id}`,
          editable: true,
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

  const openCreateAffiliate = () => {
    setProductForm({
      ...EMPTY_AFFILIATE,
      target: filter !== 'all' ? filter : websites[0] ? `web:${websites[0].slug}` : '',
    })
  }

  const openEdit = (row) => {
    if (row.source === 'merch') {
      setProductForm({
        mode: 'edit',
        source: 'merch',
        id: row.id,
        patchPath: row.patchPath,
        target: row.owner,
        name: row.name || '',
        description: row.description || '',
        imageUrl: row.imageUrl || '',
        partnerUrl: '',
        partnerName: '',
        network: '',
        ctaLabel: '',
        priceCents: row.priceCents != null ? (row.priceCents / 100).toFixed(2) : '',
        commissionPct: '',
      })
      return
    }
    setProductForm({
      mode: 'edit',
      source: row.source,
      id: row.id,
      patchPath: row.patchPath,
      target: row.owner,
      name: row.name || '',
      description: row.description || '',
      imageUrl: row.imageUrl || '',
      partnerUrl: row.partnerUrl || '',
      partnerName: row.partnerName || '',
      network: row.network || '',
      ctaLabel: row.ctaLabel || '',
      priceCents: row.priceCents != null ? (row.priceCents / 100).toFixed(2) : '',
      commissionPct: row.commissionPct != null ? String(row.commissionPct) : '',
    })
  }

  const uploadImage = async (file) => {
    if (!file || !productForm) return
    setImageBusy(true)
    setError('')
    try {
      const contentBase64 = await fileToBase64(file)
      const { imageUrl } = await api('/api/commerce/admin/upload-product-image', {
        method: 'POST',
        body: {
          contentBase64,
          filename: file.name,
          mimeType: file.type || 'image/jpeg',
        },
      })
      setProductForm((prev) => (prev ? { ...prev, imageUrl } : prev))
    } catch (err) {
      setError(err.message)
    } finally {
      setImageBusy(false)
    }
  }

  const saveProduct = async () => {
    const f = productForm
    if (!f) return
    setSaving(true)
    setError('')
    try {
      if (f.mode === 'edit' && f.source === 'merch') {
        await api(f.patchPath, {
          method: 'PATCH',
          body: {
            title: f.name.trim(),
            description: f.description || null,
            imageUrl: f.imageUrl || null,
            priceCents: f.priceCents === '' ? null : Math.round(parseFloat(f.priceCents) * 100),
          },
        })
      } else {
        const body = {
          name: f.name.trim(),
          description: f.description || null,
          imageUrl: f.imageUrl || null,
          partnerUrl: f.partnerUrl.trim(),
          partnerName: f.partnerName || null,
          network: f.network || null,
          ctaLabel: f.ctaLabel?.trim() || null,
          priceCents: f.priceCents === '' ? null : Math.round(parseFloat(f.priceCents) * 100),
          commissionPct: f.commissionPct === '' ? null : parseFloat(f.commissionPct),
        }
        if (f.mode === 'create') {
          if (f.target.startsWith('web:')) {
            const site = websites.find((w) => w.slug === f.target.slice(4))
            await api(`/api/commerce/admin/websites/${site.id}/affiliate-products`, { method: 'POST', body })
          } else {
            await api(`/api/voice/businesses/${f.target.slice(3)}/products`, {
              method: 'POST',
              body: { ...body, kind: 'affiliate' },
            })
          }
        } else {
          await api(f.patchPath, { method: 'PATCH', body })
        }
      }
      setProductForm(null)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) return <div className="text-gray-500">Commerce admin is limited to super admins.</div>

  const visible = rows?.filter((r) => filter === 'all' || r.owner === filter)
  const isMerchEdit = productForm?.mode === 'edit' && productForm?.source === 'merch'
  const formValid = productForm
    && productForm.name.trim()
    && productForm.target
    && (isMerchEdit || productForm.partnerUrl.trim())

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex flex-wrap gap-2">
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
            onClick={openCreateAffiliate}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Add Affiliate Product
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((r) => (
                <tr key={r.rowId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.imageUrl
                        ? <img src={r.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                        : <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">—</div>}
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
                      title={r.type === 'affiliate' || r.source === 'affiliate' || r.source === 'ccprod'
                        ? 'Hide from shop only — still usable as a landing CTA'
                        : 'Show or hide this product on the storefront'}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        r.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {r.active ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(r)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Edit
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

      {productForm && (
        <Modal
          title={productForm.mode === 'create' ? 'Add affiliate product' : isMerchEdit ? 'Edit merch product' : 'Edit product'}
          onClose={() => setProductForm(null)}
        >
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Show on
              <select
                value={productForm.target}
                disabled={productForm.mode === 'edit'}
                onChange={(e) => setProductForm({ ...productForm, target: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              >
                {websites.map((w) => (
                  <option key={w.slug} value={`web:${w.slug}`}>🌐 {w.name}</option>
                ))}
                {!isMerchEdit && centres.map((c) => (
                  <option key={c.id} value={`cc:${c.id}`}>📞 {c.name}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {isMerchEdit ? 'Product name *' : 'Product name *'}
              <input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Short description
              <input
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>

            <div>
              <div className="text-sm font-medium text-gray-700">Product image</div>
              <div className="mt-1 flex items-start gap-3">
                {productForm.imageUrl ? (
                  <img src={productForm.imageUrl} alt="" className="h-20 w-20 rounded object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400">
                    No image
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {imageBusy ? 'Uploading…' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={imageBusy}
                      onChange={(e) => {
                        uploadImage(e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {productForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                      className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  )}
                  <input
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    placeholder="Or paste an image URL"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {!isMerchEdit && (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  Affiliate / deep link URL *
                  <input
                    value={productForm.partnerUrl}
                    onChange={(e) => setProductForm({ ...productForm, partnerUrl: e.target.value })}
                    placeholder="https://www.kqzyfj.com/click-… or AWIN / partner URL"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Brand (shown as &quot;Sold by …&quot;)
                  <input
                    value={productForm.partnerName}
                    onChange={(e) => setProductForm({ ...productForm, partnerName: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Shop button label
                  <input
                    value={productForm.ctaLabel}
                    onChange={(e) => setProductForm({ ...productForm, ctaLabel: e.target.value })}
                    placeholder="Select This Card"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                  />
                  <span className="mt-1 block text-xs text-gray-400">
                    Shown on the shop card. Leave blank for &quot;Select This Card&quot; (gift cards). Use &quot;Select Dates&quot; for stays.
                  </span>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Network
                  <select
                    value={productForm.network}
                    onChange={(e) => setProductForm({ ...productForm, network: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                  >
                    {NETWORKS.map((n) => (
                      <option key={n} value={n}>{n || 'direct / other'}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Commission %
                  <input
                    value={productForm.commissionPct}
                    onChange={(e) => setProductForm({ ...productForm, commissionPct: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                  />
                </label>
              </>
            )}

            <label className="block text-sm font-medium text-gray-700">
              Price (optional)
              <input
                value={productForm.priceCents}
                onChange={(e) => setProductForm({ ...productForm, priceCents: e.target.value })}
                placeholder="e.g. 50.00"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>

            <button
              onClick={saveProduct}
              disabled={!formValid || saving || imageBusy}
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : productForm.mode === 'create' ? 'Add product' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
