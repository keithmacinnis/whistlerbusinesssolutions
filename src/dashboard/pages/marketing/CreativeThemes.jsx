import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth'
import CreativeStudioTabs from './CreativeStudioTabs'
import CreativeStudioGuide from './CreativeStudioGuide'

const STATUS_STYLES = {
  idea: 'bg-gray-100 text-gray-700',
  ready: 'bg-blue-50 text-blue-700',
  in_production: 'bg-violet-50 text-violet-700',
  shipped: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-amber-50 text-amber-800',
}

export default function CreativeThemes() {
  const { user } = useAuth()
  const [themes, setThemes] = useState(null)
  const [series, setSeries] = useState([])
  const [error, setError] = useState('')
  const [seriesFilter, setSeriesFilter] = useState('')

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

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Marketing tools are limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Creative Studio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Story packages grouped into series. Open a theme, then generate a shippable brief.
        </p>
      </div>
      <CreativeStudioTabs />
      <CreativeStudioGuide focus="themes" />

      <div className="mb-4 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
        <p>
          A <strong className="text-gray-800">series</strong> is a named collection of related
          themes — e.g. “More Time for What Matters” (softer story posts) and “Shared Care” (more
          direct product videos). Same object type either way: each theme still has headline,
          article, video, image, and CTA.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Series</span>
        <button
          type="button"
          onClick={() => setSeriesFilter('')}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            seriesFilter === ''
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {series.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSeriesFilter(s.slug)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              seriesFilter === s.slug
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!themes && !error && <div className="text-gray-500">Loading…</div>}

      {themes?.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No themes yet. They seed automatically from your series packs.
        </div>
      )}

      {grouped.map(([key, items]) => {
        const meta = seriesMeta(key)
        return (
          <section key={key} className="mb-8">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {meta?.name || (key === '__ungrouped__' ? 'Ungrouped' : key)}
            </h2>
            {meta?.closingLine && (
              <p className="mb-3 text-xs text-gray-400 italic">{meta.closingLine}</p>
            )}
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Theme</th>
                    <th className="px-4 py-3">Angles</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/marketing/creative/themes/${t.slug}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {t.number != null ? `${String(t.number).padStart(2, '0')}. ` : ''}
                          {t.title}
                        </Link>
                        <div className="mt-0.5 text-xs text-gray-500">{t.headline}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {(t.angleHints || []).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[t.status] || STATUS_STYLES.idea
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
