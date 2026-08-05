import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'
import CreativeStudioTabs from './CreativeStudioTabs'
import AngleHintPicker from './AngleHintPicker'
import SeriesSelect from './SeriesSelect'

const THEME_STATUSES = ['idea', 'ready', 'in_production', 'shipped', 'archived']

export default function CreativeIdeaDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [idea, setIdea] = useState(null)
  const [seriesMeta, setSeriesMeta] = useState(null)
  const [seriesList, setSeriesList] = useState([])
  const [briefs, setBriefs] = useState([])
  const [formats, setFormats] = useState([])
  const [models, setModels] = useState([])
  const [offers, setOffers] = useState([])
  const [angles, setAngles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState(null)
  const [genForm, setGenForm] = useState({
    format: 'micro_reaction',
    model: 'gpt-4o-mini',
    angle: '',
    offerSlug: 'birdnest-app',
    inputNote: '',
  })

  const load = useCallback(() => {
    Promise.all([
      api(`/api/marketing/creative/ideas/${slug}`),
      api('/api/marketing/creative/series'),
    ])
      .then(([{ idea, theme, series: s, briefs: b }, seriesRes]) => {
        const t = idea || theme
        setIdea(t)
        setSeriesMeta(s)
        setSeriesList(seriesRes.series || [])
        setBriefs(b || [])
        setForm({
          title: t.title || '',
          headline: t.headline || '',
          article: t.article || '',
          videoOutline: t.videoOutline || '',
          imageConcept: t.imageConcept || '',
          onScreenText: Array.isArray(t.onScreenText) ? t.onScreenText.join('\n') : '',
          cta: t.cta || '',
          shortCaption: t.shortCaption || '',
          angleHints: Array.isArray(t.angleHints) ? t.angleHints.join(', ') : '',
          seriesSlug: t.seriesSlug || '',
          status: t.status || 'ready',
          notes: t.notes || '',
        })
        setGenForm((prev) => ({
          ...prev,
          angle: (t.angleHints && t.angleHints[0]) || 'NEST',
        }))
      })
      .catch((err) => setError(err.message))
  }, [slug])

  useEffect(load, [load])

  useEffect(() => {
    Promise.all([
      api('/api/marketing/creative/formats'),
      api('/api/marketing/creative/models'),
      api('/api/marketing/creative/offers'),
    ])
      .then(([f, m, o]) => {
        setFormats(f.formats || [])
        setModels(m.models || [])
        setOffers(o.offers || [])
        const birdnest = o.offers?.find((x) => x.slug === 'birdnest-app') || o.offers?.[0]
        setAngles(birdnest?.angles || [])
        setGenForm((prev) => ({
          ...prev,
          model: m.defaultModel || prev.model,
          format: f.formats?.[0]?.slug || prev.format,
          offerSlug: o.offers?.[0]?.slug || prev.offerSlug,
        }))
      })
      .catch(() => {})
  }, [])

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const copy = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text || '')
      setCopied(label)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const angleHints = form.angleHints
        .split(/[,\n]/)
        .map((a) => a.trim().toUpperCase())
        .filter(Boolean)
      const onScreenText = form.onScreenText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
      const { idea: updatedIdea, theme: updatedTheme } = await api(`/api/marketing/creative/ideas/${slug}`, {
        method: 'PATCH',
        body: {
          title: form.title.trim(),
          headline: form.headline.trim(),
          article: form.article.trim(),
          videoOutline: form.videoOutline.trim(),
          imageConcept: form.imageConcept.trim() || null,
          onScreenText,
          cta: form.cta.trim() || null,
          shortCaption: form.shortCaption.trim() || null,
          angleHints,
          seriesSlug: form.seriesSlug || null,
          status: form.status,
          notes: form.notes.trim() || null,
        },
      })
      setIdea(updatedIdea || updatedTheme)
      setSeriesMeta(seriesList.find((s) => s.slug === (updatedIdea || updatedTheme).seriesSlug) || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const generate = async () => {
    setError('')
    setGenerating(true)
    try {
      const { brief } = await api(`/api/marketing/creative/ideas/${slug}/generate-brief`, {
        method: 'POST',
        body: {
          offerSlug: genForm.offerSlug,
          format: genForm.format,
          model: genForm.model,
          angle: genForm.angle,
          inputNote: genForm.inputNote.trim() || undefined,
        },
      })
      setShowGenerate(false)
      navigate(`/marketing/creative/${brief.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Marketing tools are limited to super admins.</div>
  }

  if (!form && !error) return <div className="text-gray-500">Loading…</div>
  if (!form) {
    return (
      <div>
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        <Link to="/marketing/creative/ideas" className="text-sm text-brand-700 hover:underline">
          ← Ideas
        </Link>
      </div>
    )
  }

  const selectedOffer = offers.find((o) => o.slug === genForm.offerSlug)

  return (
    <div>
      <div className="mb-2">
        <Link to="/marketing/creative/ideas" className="text-sm text-brand-700 hover:underline">
          ← Ideas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {idea?.number != null ? `${String(idea.number).padStart(2, '0')}. ` : ''}
          {form.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {seriesMeta ? seriesMeta.name : 'Ungrouped idea'}
        </p>
      </div>
      <CreativeStudioTabs />

      <div className="mb-4 rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-gray-700">
        This is an <strong>idea</strong> — the story package (not the finished ad yet). Edit the
        article/video ideas here, then hit <strong>Generate brief from idea</strong> to get hooks +
        a paste-ready CapCut/Arcads prompt for today’s ship.
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowGenerate(true)}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Generate brief from idea
        </button>
        <button
          type="button"
          onClick={() => copy('article', form.article)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied === 'article' ? 'Copied' : 'Copy article'}
        </button>
        <button
          type="button"
          onClick={() => copy('video', form.videoOutline)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied === 'video' ? 'Copied' : 'Copy video outline'}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Title
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Headline
            <input
              value={form.headline}
              onChange={(e) => updateField('headline', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <SeriesSelect
            series={seriesList}
            value={form.seriesSlug}
            onChange={(seriesSlug) => updateField('seriesSlug', seriesSlug)}
            onSeriesCreated={(created) =>
              setSeriesList((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
            }
          />
          <label className="block text-sm font-medium text-gray-700">
            Status
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {THEME_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Angle hints
            <input
              value={form.angleHints}
              onChange={(e) => updateField('angleHints', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
            />
            <AngleHintPicker
              angles={angles}
              value={form.angleHints}
              onChange={(angleHints) => updateField('angleHints', angleHints)}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            CTA
            <input
              value={form.cta}
              onChange={(e) => updateField('cta', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>

          {briefs.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Briefs from this idea
              </div>
              <ul className="space-y-1 text-sm">
                {briefs.map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/marketing/creative/${b.id}`}
                      className="text-brand-700 hover:underline"
                    >
                      {b.title}
                    </Link>
                    <span className="ml-2 text-xs text-gray-400">
                      {b.format} · {b.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Article / social caption
            <textarea
              value={form.article}
              onChange={(e) => updateField('article', e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Video outline
            <textarea
              value={form.videoOutline}
              onChange={(e) => updateField('videoOutline', e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Image concept
            <textarea
              value={form.imageConcept}
              onChange={(e) => updateField('imageConcept', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            On-screen text (one per line)
            <textarea
              value={form.onScreenText}
              onChange={(e) => updateField('onScreenText', e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Short caption
            <textarea
              value={form.shortCaption}
              onChange={(e) => updateField('shortCaption', e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {showGenerate && (
        <Modal
          title="Generate brief from idea"
          onClose={() => !generating && setShowGenerate(false)}
          wide
        >
          <p className="mb-4 text-sm text-gray-500">
            Uses this idea’s headline, article, and video outline as the brief’s vibe note, then
            builds a paste-ready {genForm.format.replace(/_/g, ' ')} package.
          </p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Offer
              <select
                value={genForm.offerSlug}
                onChange={(e) => setGenForm({ ...genForm, offerSlug: e.target.value })}
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
                value={genForm.angle}
                onChange={(e) => setGenForm({ ...genForm, angle: e.target.value })}
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
                value={genForm.format}
                onChange={(e) => setGenForm({ ...genForm, format: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {formats.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Model
              <select
                value={genForm.model}
                onChange={(e) => setGenForm({ ...genForm, model: e.target.value })}
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
              Extra note (optional)
              <textarea
                value={genForm.inputNote}
                onChange={(e) => setGenForm({ ...genForm, inputNote: e.target.value })}
                rows={2}
                placeholder="e.g. lean into grandma handoff / keep under 8s"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {generating ? 'Generating… (may take ~15s)' : 'Generate brief'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
