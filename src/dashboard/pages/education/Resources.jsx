import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'

const KINDS = ['book', 'guide', 'product', 'digital', 'course']
const EMPTY = {
  title: '',
  slug: '',
  blurb: '',
  description: '',
  imageUrl: '',
  kind: 'book',
  category: '',
  externalUrl: '',
  affiliateNetwork: '',
  digitalAssetId: '',
  courseTemplateId: '',
  sortOrder: 0,
  active: true,
}

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function EducationResources() {
  const [resources, setResources] = useState(null)
  const [assets, setAssets] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [assetForm, setAssetForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(() => {
    setError('')
    Promise.all([
      api('/api/education/admin/resources'),
      api('/api/education/admin/digital-assets'),
    ])
      .then(([{ resources: r }, { assets: a }]) => {
        setResources(r)
        setAssets(a)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const saveResource = async () => {
    setBusy(true)
    setError('')
    try {
      const body = {
        ...form,
        digitalAssetId: form.digitalAssetId || null,
        courseTemplateId: form.courseTemplateId || null,
        sortOrder: Number(form.sortOrder) || 0,
      }
      if (form.id) {
        await api(`/api/education/admin/resources/${form.id}`, { method: 'PATCH', body })
      } else {
        await api('/api/education/admin/resources', { method: 'POST', body })
      }
      setForm(null)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const uploadAsset = async () => {
    setBusy(true)
    setError('')
    try {
      const { title, priceCents, file } = assetForm
      if (!file) throw new Error('Choose a PDF file')
      const contentBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = String(reader.result || '')
          const b64 = result.includes(',') ? result.split(',')[1] : result
          resolve(b64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      await api('/api/education/admin/digital-assets', {
        method: 'POST',
        body: {
          title,
          filename: file.name,
          contentBase64,
          mimeType: file.type || 'application/pdf',
          priceCents: Math.round(Number(priceCents) * 100),
        },
      })
      setAssetForm(null)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this resource?')) return
    try {
      await api(`/api/education/admin/resources/${id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setAssetForm({ title: '', priceCents: '10', file: null })}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Upload PDF
          </button>
          <button
            onClick={() => setForm({ ...EMPTY })}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Add resource
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {assets.length > 0 && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Digital assets</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            {assets.map((a) => (
              <li key={a.id}>
                {a.title} — {dollars(a.priceCents)}{' '}
                <span className="text-xs text-gray-400">({a.filename})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!resources && !error && <div className="text-gray-500">Loading…</div>}

      {resources && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.title}</div>
                    <div className="text-xs text-gray-400">/{r.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.kind}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${r.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {r.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() =>
                        setForm({
                          ...r,
                          digitalAssetId: r.digitalAssetId || '',
                          courseTemplateId: r.courseTemplateId || '',
                        })
                      }
                      className="text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => remove(r.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!resources.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No resources yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Edit resource' : 'Add resource'} onClose={() => setForm(null)}>
          <div className="space-y-3">
            <Field label="Title">
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Slug (optional)">
              <input className="input" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field label="Kind">
              <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Blurb">
              <input className="input" value={form.blurb || ''} onChange={(e) => setForm({ ...form, blurb: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Image URL">
              <input className="input" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </Field>
            <Field label="External / affiliate URL">
              <input className="input" value={form.externalUrl || ''} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} />
            </Field>
            <Field label="Digital asset">
              <select className="input" value={form.digitalAssetId || ''} onChange={(e) => setForm({ ...form, digitalAssetId: e.target.value })}>
                <option value="">— none —</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.title} ({dollars(a.priceCents)})</option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Active on site
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setForm(null)} className="rounded-md px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button disabled={busy} onClick={saveResource} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {assetForm && (
        <Modal title="Upload PDF" onClose={() => setAssetForm(null)}>
          <div className="space-y-3">
            <Field label="Title">
              <input className="input" value={assetForm.title} onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })} />
            </Field>
            <Field label="Price (USD)">
              <input className="input" type="number" step="0.01" value={assetForm.priceCents} onChange={(e) => setAssetForm({ ...assetForm, priceCents: e.target.value })} />
            </Field>
            <Field label="PDF file">
              <input type="file" accept="application/pdf,.pdf" onChange={(e) => setAssetForm({ ...assetForm, file: e.target.files?.[0] || null })} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAssetForm(null)} className="rounded-md px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button disabled={busy} onClick={uploadAsset} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                Upload
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`.input{width:100%;border:1px solid #e5e7eb;border-radius:0.375rem;padding:0.5rem 0.75rem;font-size:0.875rem}`}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-600">{label}</span>
      {children}
    </label>
  )
}
