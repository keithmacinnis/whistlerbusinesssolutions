import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'

const STATUS_STYLES = {
  idea: 'bg-gray-100 text-gray-700',
  briefed: 'bg-blue-50 text-blue-700',
  prompted: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-amber-50 text-amber-800',
}

function formatLabel(slug) {
  return (
    {
      micro_reaction: 'Micro reaction',
      talking_head_screen: 'Talking head + screen',
      seedance_oner: 'Seedance one-take',
      caption_pack: 'Caption pack',
    }[slug] || slug
  )
}

export default function CreativeStudio() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState(null)
  const [offers, setOffers] = useState([])
  const [formats, setFormats] = useState([])
  const [models, setModels] = useState([])
  const [defaultModel, setDefaultModel] = useState('gpt-4o-mini')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({
    offerSlug: 'birdnest-app',
    angle: 'MOMENTS',
    format: 'micro_reaction',
    model: 'gpt-4o-mini',
    inputNote: '',
  })

  const reload = useCallback(() => {
    api('/api/marketing/creative/briefs', {
      params: statusFilter ? { status: statusFilter } : {},
    })
      .then(({ briefs: list }) => setBriefs(list))
      .catch((err) => setError(err.message))
  }, [statusFilter])

  useEffect(reload, [reload])

  useEffect(() => {
    Promise.all([
      api('/api/marketing/creative/offers'),
      api('/api/marketing/creative/formats'),
      api('/api/marketing/creative/models'),
    ])
      .then(([o, f, m]) => {
        setOffers(o.offers || [])
        setFormats(f.formats || [])
        setModels(m.models || [])
        const def = m.defaultModel || 'gpt-4o-mini'
        setDefaultModel(def)
        if (o.offers?.[0]) {
          setForm((prev) => ({
            ...prev,
            offerSlug: prev.offerSlug || o.offers[0].slug,
            angle: prev.angle || o.offers[0].angles?.[0]?.code || 'MOMENTS',
            model: prev.model || def,
          }))
        } else {
          setForm((prev) => ({ ...prev, model: prev.model || def }))
        }
      })
      .catch((err) => setError(err.message))
  }, [])

  const selectedOffer = offers.find((o) => o.slug === form.offerSlug)

  const openNew = () => {
    const offer = offers[0]
    setForm({
      offerSlug: offer?.slug || 'birdnest-app',
      angle: offer?.angles?.[0]?.code || 'MOMENTS',
      format: formats[0]?.slug || 'micro_reaction',
      model: defaultModel,
      inputNote: '',
    })
    setAdding(true)
  }

  const generate = async () => {
    setError('')
    setSaving(true)
    try {
      const { brief } = await api('/api/marketing/creative/briefs/generate', {
        method: 'POST',
        body: {
          offerSlug: form.offerSlug,
          angle: form.angle,
          format: form.format,
          model: form.model,
          inputNote: form.inputNote.trim() || undefined,
        },
      })
      setAdding(false)
      navigate(`/marketing/creative/${brief.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this brief?')) return
    try {
      await api(`/api/marketing/creative/briefs/${id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Marketing tools are limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Studio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Turn offer + angle into paste-ready briefs for CapCut Seedance, Arcads, and ad copy.
          </p>
        </div>
        <button
          onClick={openNew}
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New brief
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</span>
        {['', 'briefed', 'prompted', 'idea', 'archived'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!briefs && !error && <div className="text-gray-500">Loading…</div>}

      {briefs?.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No briefs yet. Generate one from an offer angle to get hooks, beats, and a paste-ready prompt.
        </div>
      )}

      {briefs && briefs.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Angle</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {briefs.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/marketing/creative/${b.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {b.title}
                    </Link>
                    <div className="mt-0.5 text-xs text-gray-400">{b.offerSlug}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{b.angle}</td>
                  <td className="px-4 py-3 text-gray-600">{formatLabel(b.format)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[b.status] || STATUS_STYLES.idea
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(b.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(b.id)}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <Modal title="Generate a creative brief" onClose={() => !saving && setAdding(false)} wide>
          <p className="mb-4 text-sm text-gray-500">
            Pick an offer, angle, and format. Optional vibe note steers the story (e.g. “grandma
            visiting, Seedance one-take energy”).
          </p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Offer
              <select
                value={form.offerSlug}
                onChange={(e) => {
                  const offer = offers.find((o) => o.slug === e.target.value)
                  setForm({
                    ...form,
                    offerSlug: e.target.value,
                    angle: offer?.angles?.[0]?.code || form.angle,
                  })
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {offers.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Angle
              <select
                value={form.angle}
                onChange={(e) => setForm({ ...form, angle: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {(selectedOffer?.angles || []).map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.promise}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Format
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {formats.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                    {f.lengthHint ? ` (${f.lengthHint})` : ''}
                  </option>
                ))}
              </select>
              {formats.find((f) => f.slug === form.format)?.description && (
                <span className="mt-1 block text-xs font-normal text-gray-400">
                  {formats.find((f) => f.slug === form.format).description}
                </span>
              )}
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Model
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.hint ? ` — ${m.hint}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Vibe / reference note
              <textarea
                value={form.inputNote}
                onChange={(e) => setForm({ ...form, inputNote: e.target.value })}
                rows={3}
                placeholder="Optional — e.g. partner night feed, forgotten home-video feel, frozen-time rewind…"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <button
              type="button"
              onClick={generate}
              disabled={saving || !form.offerSlug || !form.angle || !form.format}
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Generating… (may take ~15s)' : 'Generate brief'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
