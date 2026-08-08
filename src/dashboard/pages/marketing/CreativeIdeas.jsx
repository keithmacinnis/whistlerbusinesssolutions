import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'
import { hasRole } from '../../roles'
import CreativeStudioTabs from './CreativeStudioTabs'
import CreativeStudioGuide from './CreativeStudioGuide'
import AngleHintPicker from './AngleHintPicker'
import SeriesSelect, { CreateSeriesPlus } from './SeriesSelect'
import AuthorTag from './AuthorTag'

const STATUS_STYLES = {
  idea: 'bg-amber-50 text-amber-800 ring-amber-200',
  ready: 'bg-sky-50 text-sky-800 ring-sky-200',
  in_production: 'bg-violet-50 text-violet-800 ring-violet-200',
  posted: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  archived: 'bg-gray-100 text-gray-600 ring-gray-200',
}

const STATUS_LABELS = {
  idea: 'idea',
  ready: 'ready',
  in_production: 'in production',
  posted: 'posted',
  archived: 'archived',
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
  author: '',
}

function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
        STATUS_STYLES[status] || STATUS_STYLES.idea
      }`}
    >
      {STATUS_LABELS[status] || status.replace(/_/g, ' ')}
    </span>
  )
}

function Section({ n, title, hint, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/80 to-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {n}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export default function CreativeIdeas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState(null)
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

    api('/api/marketing/creative/ideas', { params })
      .then((res) => {
        setIdeas(res.ideas || res.themes || [])
        setSeries(res.series || [])
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
    if (!ideas) return []
    const order = (series || []).map((s) => s.slug)
    const buckets = new Map()
    for (const t of ideas) {
      const key = t.seriesSlug || '__ungrouped__'
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(t)
    }
    const keys = [
      ...order.filter((slug) => buckets.has(slug)),
      ...[...buckets.keys()].filter((k) => !order.includes(k)),
    ]
    return keys.map((key) => [key, buckets.get(key)])
  }, [ideas, series])

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
      const res = await api('/api/marketing/creative/ideas', {
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
          ...(form.author.trim() ? { author: form.author.trim() } : {}),
        },
      })
      const created = res.idea || res.theme
      setCreating(false)
      navigate(`/marketing/creative/ideas/${created.slug}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const canCreate =
    form.title.trim() && form.headline.trim() && form.article.trim() && form.videoOutline.trim()

  const requiredLeft = [
    !form.title.trim() && 'title',
    !form.headline.trim() && 'headline',
    !form.article.trim() && 'article',
    !form.videoOutline.trim() && 'video outline',
  ].filter(Boolean)

  if (!hasRole(user, 'super_admin', 'ambassador')) {
    return <div className="text-gray-500">Marketing tools are limited to admins and ambassadors.</div>
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Studio</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Ideas are the start of the pipeline — story packages you grow into briefs and ship.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate(seriesFilter || undefined)}
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          + New idea
        </button>
      </div>
      <CreativeStudioTabs />
      <CreativeStudioGuide focus="ideas" />

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
      {!ideas && !error && <div className="text-gray-500">Loading…</div>}

      {ideas?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gradient-to-b from-white to-gray-50 px-6 py-16 text-center">
          <p className="text-base font-medium text-gray-800">No ideas in this series yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Capture a headline, article, and video outline — then generate briefs from it.
          </p>
          <button
            type="button"
            onClick={() => openCreate(seriesFilter || undefined)}
            className="mt-5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create your first idea
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
                  {items.length} idea{items.length === 1 ? '' : 's'}
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
                  to={`/marketing/creative/ideas/${t.slug}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                      {t.number != null ? String(t.number).padStart(2, '0') : '•'}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusChip status={t.status} />
                      <AuthorTag
                        tag={(t.author || '?').slice(0, 6)}
                        title={t.author || 'Unknown author'}
                      />
                    </div>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-gray-900 group-hover:text-brand-800">
                    {t.title}
                  </h3>
                  {t.parentSlug ? (
                    <p className="mt-1 text-[11px] text-violet-600">↳ from {t.parentSlug}</p>
                  ) : null}
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
                    Open idea →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      {creating && (
        <Modal onClose={() => !saving && setCreating(false)} extraWide>
          <div className="-mx-0 overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-sky-700 px-6 pb-6 pt-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-100">
                  New idea
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {form.title.trim() || 'Untitled idea'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !saving && setCreating(false)}
                className="text-2xl leading-none text-white/70 hover:text-white"
              >
                &times;
              </button>
            </div>
            <blockquote className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-base leading-relaxed text-white/95 ring-1 ring-white/15">
              {form.headline.trim()
                ? `“${form.headline.trim()}”`
                : '“Your headline will preview here as you type…”'}
            </blockquote>
            <p className="mt-3 text-xs text-brand-100">
              Capture the story first. Briefs and CapCut prompts come next.
            </p>
          </div>

          <div className="space-y-5 px-6 pb-2 pt-5">
            {error && (
              <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SeriesSelect
                series={series}
                value={form.seriesSlug}
                onChange={(seriesSlug) => setForm({ ...form, seriesSlug })}
                onSeriesCreated={(created) =>
                  setSeries((prev) =>
                    [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
                  )
                }
              />
              <label className="block text-sm font-medium text-gray-700">
                Author
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Blank = your email initial"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {['idea', 'ready', 'in_production', 'posted', 'archived'].map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Section n="01" title="The spark" hint="Name it, give it a headline, pick the emotional angles.">
              <label className="block text-sm font-medium text-gray-700">
                Title *
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Creating a Safe Nest Is a Skill"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Headline *
                <input
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="The line that carries the post"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
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
            </Section>

            <Section n="02" title="The words" hint="Article for the feed, short cut for Stories, on-screen lines, CTA.">
              <label className="block text-sm font-medium text-gray-700">
                Article / social caption *
                <textarea
                  value={form.article}
                  onChange={(e) => setForm({ ...form, article: e.target.value })}
                  rows={5}
                  placeholder="Wonder-forward story. What should a parent feel and understand?"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm leading-relaxed focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Short caption
                <textarea
                  value={form.shortCaption}
                  onChange={(e) => setForm({ ...form, shortCaption: e.target.value })}
                  rows={3}
                  placeholder="Optional shorter cut for Stories / ads primary text"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  On-screen text
                  <textarea
                    value={form.onScreenText}
                    onChange={(e) => setForm({ ...form, onScreenText: e.target.value })}
                    rows={3}
                    placeholder={'Not perfection.\nPresence.'}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <span className="mt-1 block text-xs font-normal text-gray-400">One line per row</span>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  CTA
                  <input
                    value={form.cta}
                    onChange={(e) => setForm({ ...form, cta: e.target.value })}
                    placeholder="Try BirdNest free for a month."
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <span className="mt-1 block text-xs font-normal text-gray-400">
                    Soft invite, not a hard sell
                  </span>
                </label>
              </div>
            </Section>

            <Section n="03" title="The picture" hint="How it looks and moves — enough to shoot or prompt later.">
              <label className="block text-sm font-medium text-gray-700">
                Video outline *
                <textarea
                  value={form.videoOutline}
                  onChange={(e) => setForm({ ...form, videoOutline: e.target.value })}
                  rows={5}
                  placeholder="Opening → product/care moment → close. Keep it human."
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm leading-relaxed focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Image concept
                <textarea
                  value={form.imageConcept}
                  onChange={(e) => setForm({ ...form, imageConcept: e.target.value })}
                  rows={2}
                  placeholder="Still / thumbnail direction — light, people, mood"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Notes
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional — source, owner, shoot date…"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
            </Section>

            <div className="sticky bottom-0 -mx-6 flex flex-col gap-2 border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {canCreate
                  ? 'Ready to save — you can generate a brief right after.'
                  : `Still need: ${requiredLeft.join(', ')}`}
              </p>
              <button
                type="button"
                onClick={create}
                disabled={!canCreate || saving}
                className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create idea'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
