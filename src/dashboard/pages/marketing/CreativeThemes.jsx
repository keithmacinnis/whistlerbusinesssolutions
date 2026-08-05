import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'
import CreativeStudioTabs from './CreativeStudioTabs'
import CreativeStudioGuide from './CreativeStudioGuide'
import AngleHintPicker from './AngleHintPicker'
import SeriesSelect, { CreateSeriesPlus } from './SeriesSelect'

const STATUS_STYLES = {
  idea: 'bg-amber-50 text-amber-800 ring-amber-200',
  ready: 'bg-sky-50 text-sky-800 ring-sky-200',
  in_production: 'bg-violet-50 text-violet-800 ring-violet-200',
  shipped: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  archived: 'bg-gray-100 text-gray-600 ring-gray-200',
}

const emptyForm = {
  seriesSlug: 'more-time-for-what-matters',
  title: '',
  headline: '',
  article: '',
  videoOutline: '',
  imageConcept: '',
  onScreenText: '',
  cta: '',
  shortCaption: '',
  angleHints: 'NEST',
  status: 'idea',
  notes: '',
}

function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
        STATUS_STYLES[status] || STATUS_STYLES.idea
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default function CreativeThemes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [themes, setThemes] = useState(null)
  const [series, setSeries] = useState([])
  const [angles, setAngles] = useState([])
  const [error, setError] = useState('')
  const [seriesFilter, setSeriesFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const reload = useCallback(() => {
    const params = {}
    if (seriesFilter) params.seriesSlug = seriesFilter

    api('/api/marketing/creative/themes', { params })
      .then(({ themes: list, series: s }) => {
        setThemes(list)
        setSeries(s || [])
      })
      .catch((err) => setError(err.message))
  }, [seriesFilter])

  useEffect(reload, [reload])

  useEffect(() => {
    api('/api/marketing/creative/offers')
      .then(({ offers }) => {
        const birdnest = offers?.find((o) => o.slug === 'birdnest-app') || offers?.[0]
        setAngles(birdnest?.angles || [])
      })
      .catch(() => {})
  }, [])

  const seriesMeta = useMemo(() => {
    const map = Object.fromEntries((series || []).map((s) => [s.slug, s]))
    return (slug) => map[slug] || null
  }, [series])

  const grouped = useMemo(() => {
    if (!themes) return []
    const order = (series || []).map((s) => s.slug)
    const buckets = new Map()
    for (const t of themes) {
      const key = t.seriesSlug || '__ungrouped__'
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(t)
    }
    const keys = [
      ...order.filter((slug) => buckets.has(slug)),
      ...[...buckets.keys()].filter((k) => !order.includes(k)),
    ]
    return keys.map((key) => [key, buckets.get(key)])
  }, [themes, series])

  const openCreate = (seriesSlug) => {
    setForm({
      ...emptyForm,
      seriesSlug: seriesSlug || series[0]?.slug || 'more-time-for-what-matters',
    })
    setCreating(true)
    setError('')
  }

  const create = async () => {
    setError('')
    setSaving(true)
    try {
      const { theme } = await api('/api/marketing/creative/themes', {
        method: 'POST',
        body: {
          seriesSlug: form.seriesSlug || null,
          title: form.title.trim(),
          headline: form.headline.trim(),
          article: form.article.trim(),
          videoOutline: form.videoOutline.trim(),
          imageConcept: form.imageConcept.trim() || undefined,
          onScreenText: form.onScreenText,
          cta: form.cta.trim() || undefined,
          shortCaption: form.shortCaption.trim() || undefined,
          angleHints: form.angleHints,
          status: form.status,
          notes: form.notes.trim() || undefined,
        },
      })
      setCreating(false)
      navigate(`/marketing/creative/themes/${theme.slug}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const canCreate =
    form.title.trim() && form.headline.trim() && form.article.trim() && form.videoOutline.trim()

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Marketing tools are limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Studio</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Themes are the heart of the pipeline — full story packages you can grow into briefs and
            ship.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate(seriesFilter || undefined)}
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          + New theme
        </button>
      </div>
      <CreativeStudioTabs />
      <CreativeStudioGuide focus="themes" />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Series</span>
        <button
          type="button"
          onClick={() => setSeriesFilter('')}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            seriesFilter === ''
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {series.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSeriesFilter(s.slug)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              seriesFilter === s.slug
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {s.name}
          </button>
        ))}
        <CreateSeriesPlus
          onCreated={(created) => {
            setSeries((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
            setSeriesFilter(created.slug)
          }}
        />
      </div>

      {error && !creating && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {!themes && !error && <div className="text-gray-500">Loading…</div>}

      {themes?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gradient-to-b from-white to-gray-50 px-6 py-16 text-center">
          <p className="text-base font-medium text-gray-800">No themes in this series yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Capture a headline, article, and video outline — then generate briefs from it.
          </p>
          <button
            type="button"
            onClick={() => openCreate(seriesFilter || undefined)}
            className="mt-5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create your first theme
          </button>
        </div>
      )}

      {grouped.map(([key, items]) => {
        const meta = seriesMeta(key)
        return (
          <section key={key} className="mb-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                  {meta?.name || (key === '__ungrouped__' ? 'Ungrouped' : key)}
                </h2>
                {meta?.closingLine && (
                  <p className="mt-1 max-w-2xl text-sm italic text-gray-500">{meta.closingLine}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-400">
                  {items.length} theme{items.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => openCreate(key === '__ungrouped__' ? '' : key)}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  + Add to series
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((t) => (
                <Link
                  key={t.id}
                  to={`/marketing/creative/themes/${t.slug}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                      {t.number != null ? String(t.number).padStart(2, '0') : '•'}
                    </div>
                    <StatusChip status={t.status} />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-gray-900 group-hover:text-brand-800">
                    {t.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
                    “{t.headline}”
                  </p>
                  {(t.angleHints || []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {t.angleHints.map((a) => (
                        <span
                          key={a}
                          className="rounded-md bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-500 ring-1 ring-gray-100"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-4 text-xs font-medium text-brand-700 opacity-0 transition group-hover:opacity-100">
                    Open theme →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      {creating && (
        <Modal title="Create a theme" onClose={() => !saving && setCreating(false)} wide>
          <p className="mb-5 text-sm text-gray-500">
            Capture the story package the way you’d brief a writer or filmmaker — headline first,
            then article, video, and CTA.
          </p>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SeriesSelect
                series={series}
                value={form.seriesSlug}
                onChange={(seriesSlug) => setForm({ ...form, seriesSlug })}
                onSeriesCreated={(created) => setSeries((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))}
              />
              <label className="block text-sm font-medium text-gray-700">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {['idea', 'ready', 'in_production', 'shipped', 'archived'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                The idea
              </div>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Title *
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Creating a Safe Nest Is a Skill"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Headline *
                <input
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="The line that carries the post"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Angle hints
                <input
                  value={form.angleHints}
                  onChange={(e) => setForm({ ...form, angleHints: e.target.value })}
                  placeholder="NEST, TOGETHER, MOMENTS"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
                />
                <AngleHintPicker
                  angles={angles}
                  value={form.angleHints}
                  onChange={(angleHints) => setForm({ ...form, angleHints })}
                />
              </label>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Words
              </div>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Article / social caption *
                <textarea
                  value={form.article}
                  onChange={(e) => setForm({ ...form, article: e.target.value })}
                  rows={5}
                  placeholder="The long-form story or post body"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Short caption
                <textarea
                  value={form.shortCaption}
                  onChange={(e) => setForm({ ...form, shortCaption: e.target.value })}
                  rows={3}
                  placeholder="Optional shorter cut for Stories / ads primary text"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                On-screen text (one line per row)
                <textarea
                  value={form.onScreenText}
                  onChange={(e) => setForm({ ...form, onScreenText: e.target.value })}
                  rows={3}
                  placeholder={'Not perfection.\nPresence.'}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                CTA
                <input
                  value={form.cta}
                  onChange={(e) => setForm({ ...form, cta: e.target.value })}
                  placeholder="Try BirdNest free for a month."
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Visuals
              </div>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Video outline *
                <textarea
                  value={form.videoOutline}
                  onChange={(e) => setForm({ ...form, videoOutline: e.target.value })}
                  rows={5}
                  placeholder="Scene-by-scene: opening, product moment, close…"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Image concept
                <textarea
                  value={form.imageConcept}
                  onChange={(e) => setForm({ ...form, imageConcept: e.target.value })}
                  rows={2}
                  placeholder="Still / thumbnail direction"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional — source, owner, shoot date…"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <button
              type="button"
              onClick={create}
              disabled={!canCreate || saving}
              className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create theme'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
