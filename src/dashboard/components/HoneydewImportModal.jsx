import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import Modal from './Modal'

const dollars = (cents) => `$${(cents / 100).toFixed(2)}`
const round99 = (cents) => Math.max(Math.round(cents / 100) * 100 - 1, 99)

const LIST_CAP = 100 // the feed has 2000+ products; search/filter to narrow

// Import picker for the Honeydew USA feed: check products, tune sizes per
// product (or mass-apply to everything checked), set a markup, import.
export default function HoneydewImportModal({ defaultStore, onClose, onImported }) {
  const [feed, setFeed] = useState(null)
  const [importedIds, setImportedIds] = useState({}) // store -> Set(externalProductId)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [store, setStore] = useState(defaultStore || 'birdnest')
  const [markup, setMarkup] = useState('100')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  // externalProductId -> Set(variantId) for checked products
  const [selection, setSelection] = useState(new Map())
  const [massSizes, setMassSizes] = useState(new Set())

  useEffect(() => {
    Promise.all([
      api('/api/commerce/admin/honeydew/products'),
      api('/api/commerce/admin/products'),
    ])
      .then(([{ products }, { products: mine }]) => {
        setFeed(products)
        const byStore = {}
        for (const p of mine) {
          if (p.supplier !== 'honeydew' || !p.externalProductId) continue
          byStore[p.store] = byStore[p.store] || new Set()
          byStore[p.store].add(p.externalProductId)
        }
        setImportedIds(byStore)
      })
      .catch((err) => setError(err.message))
  }, [])

  const types = useMemo(
    () => [...new Set((feed || []).map((p) => p.productType).filter(Boolean))].sort(),
    [feed]
  )

  const visible = useMemo(() => {
    if (!feed) return []
    const q = search.trim().toLowerCase()
    return feed.filter(
      (p) =>
        (!type || p.productType === type) &&
        (!q || p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
    )
  }, [feed, search, type])

  const allSizes = useMemo(
    () => [...new Set(visible.flatMap((p) => p.variants.map((v) => v.title)))],
    [visible]
  )

  const markupPct = parseInt(markup, 10)
  const markupOk = Number.isInteger(markupPct) && markupPct >= 0 && markupPct <= 1000
  const yourPrice = (cents) => (markupOk ? dollars(round99(cents * (1 + markupPct / 100))) : '—')

  const toggleProduct = (p) => {
    const next = new Map(selection)
    if (next.has(p.externalProductId)) next.delete(p.externalProductId)
    else next.set(p.externalProductId, new Set(p.variants.filter((v) => v.available).map((v) => v.id)))
    setSelection(next)
  }

  const toggleSize = (p, variantId) => {
    const next = new Map(selection)
    const sizes = new Set(next.get(p.externalProductId))
    if (sizes.has(variantId)) sizes.delete(variantId)
    else sizes.add(variantId)
    next.set(p.externalProductId, sizes)
    setSelection(next)
  }

  const selectAllVisible = () => {
    const next = new Map(selection)
    for (const p of visible.slice(0, LIST_CAP)) {
      if (!next.has(p.externalProductId)) {
        next.set(p.externalProductId, new Set(p.variants.filter((v) => v.available).map((v) => v.id)))
      }
    }
    setSelection(next)
  }

  const applyMassSizes = () => {
    if (!massSizes.size) return
    const byId = Object.fromEntries((feed || []).map((p) => [p.externalProductId, p]))
    const next = new Map(selection)
    for (const [id] of next) {
      const p = byId[id]
      if (!p) continue
      next.set(id, new Set(p.variants.filter((v) => massSizes.has(v.title)).map((v) => v.id)))
    }
    setSelection(next)
  }

  const importable = [...selection.entries()].filter(([, sizes]) => sizes.size > 0)

  const runImport = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await api('/api/commerce/admin/honeydew/import', {
        method: 'POST',
        body: {
          store,
          markupPct,
          products: importable.map(([externalProductId, sizes]) => ({
            externalProductId,
            variantIds: [...sizes],
          })),
        },
      })
      onImported(result)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const imported = importedIds[store] || new Set()

  return (
    <Modal title="🇺🇸 Import from Honeydew USA" onClose={onClose} wide>
      {error && <div className="mb-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!feed && !error && <div className="text-sm text-gray-500">Loading the Honeydew catalog…</div>}
      {feed && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-gray-700">
              Into store
              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              >
                <option value="birdnest">BirdNest Families</option>
                <option value="whistler">Whistler Business Solutions</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Markup % (covers their shipping too)
              <input
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs font-normal text-gray-400">
                {markupOk ? `their $13.99 → you sell ${yourPrice(1399)}` : 'enter 0–1000'}
              </span>
            </label>
          </div>

          <div className="mb-3 flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${feed.length} products (title or tag, e.g. "bamboo", "Baby")…`}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <button onClick={selectAllVisible} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
              Select all shown
            </button>
            <button onClick={() => setSelection(new Map())} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
              Select none
            </button>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">Sizes for all selected:</span>
            {allSizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  const next = new Set(massSizes)
                  if (next.has(s)) next.delete(s)
                  else next.add(s)
                  setMassSizes(next)
                }}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  massSizes.has(s) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={applyMassSizes}
              disabled={!massSizes.size || !selection.size}
              className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-40"
            >
              Apply to selected
            </button>
          </div>

          <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {visible.slice(0, LIST_CAP).map((p) => {
              const checked = selection.has(p.externalProductId)
              const sizes = selection.get(p.externalProductId)
              return (
                <div key={p.externalProductId} className={`rounded-md border p-3 ${checked ? 'border-brand-500 bg-brand-50/40' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={checked} onChange={() => toggleProduct(p)} className="h-4 w-4" />
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">{p.title}</div>
                      <div className="text-xs text-gray-500">
                        their {dollars(p.priceCents)} → you sell <span className="font-semibold text-gray-700">{yourPrice(p.priceCents)}</span>
                        {imported.has(p.externalProductId) && (
                          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">imported — will update</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {checked && (
                    <div className="mt-2 flex flex-wrap gap-1 pl-7">
                      {p.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => toggleSize(p, v.id)}
                          disabled={!v.available}
                          title={v.available ? '' : 'out of stock at Honeydew'}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            !v.available
                              ? 'bg-gray-50 text-gray-300 line-through'
                              : sizes?.has(v.id)
                                ? 'bg-brand-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {v.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {visible.length > LIST_CAP && (
              <div className="py-2 text-center text-xs text-gray-400">
                Showing {LIST_CAP} of {visible.length} — search or filter to narrow down.
              </div>
            )}
            {visible.length === 0 && <div className="py-4 text-center text-sm text-gray-500">Nothing matches.</div>}
          </div>

          <button
            onClick={runImport}
            disabled={busy || !markupOk || importable.length === 0}
            className="mt-4 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? 'Importing…' : `Import ${importable.length} product(s) into ${store === 'birdnest' ? 'BirdNest' : 'WBS'}`}
          </button>
        </>
      )}
    </Modal>
  )
}
