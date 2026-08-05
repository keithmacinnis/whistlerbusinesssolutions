import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth'
import CreativeStudioTabs from './CreativeStudioTabs'
import CreativeStudioGuide from './CreativeStudioGuide'

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

export default function CreativeShip() {
  const { user } = useAuth()
  const [briefs, setBriefs] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('briefed')
  const [busyId, setBusyId] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const reload = useCallback(() => {
    const params = filter ? { status: filter } : {}
    api('/api/marketing/creative/briefs', { params })
      .then(({ briefs: list }) => setBriefs(list))
      .catch((err) => setError(err.message))
  }, [filter])

  useEffect(reload, [reload])

  const copyPrompt = async (brief) => {
    try {
      await navigator.clipboard.writeText(brief.generationPrompt || '')
      setCopiedId(brief.id)
      setTimeout(() => setCopiedId(''), 1500)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  const markPrompted = async (brief) => {
    setBusyId(brief.id)
    setError('')
    try {
      await api(`/api/marketing/creative/briefs/${brief.id}`, {
        method: 'PATCH',
        body: { status: 'prompted' },
      })
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  const copyAndMark = async (brief) => {
    await copyPrompt(brief)
    if (brief.status !== 'prompted') await markPrompted(brief)
  }

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Marketing tools are limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Creative Studio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Daily queue — copy paste-ready prompts and knock out 1–2 pieces.
        </p>
      </div>
      <CreativeStudioTabs />
      <CreativeStudioGuide focus="ship" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Show</span>
        {[
          { id: 'briefed', label: 'Ready to ship' },
          { id: 'prompted', label: 'Already pasted' },
          { id: '', label: 'All briefs' },
        ].map((opt) => (
          <button
            key={opt.id || 'all'}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filter === opt.id
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!briefs && !error && <div className="text-gray-500">Loading…</div>}

      {briefs?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <p className="font-medium text-gray-800">
            {filter === 'briefed' ? 'Nothing ready to ship yet' : 'No briefs here'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Generate a brief from an idea, then come back here to copy and ship.
          </p>
          <Link
            to="/marketing/creative/ideas"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Browse ideas →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {briefs?.map((b) => (
          <div
            key={b.id}
            className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/marketing/creative/${b.id}`}
                  className="truncate text-base font-semibold text-gray-900 hover:text-brand-700"
                >
                  {b.title}
                </Link>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                    STATUS_STYLES[b.status] || STATUS_STYLES.idea
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {formatLabel(b.format)} · {b.angle}
                {b.themeSlug ? (
                  <>
                    {' · '}
                    <Link
                      to={`/marketing/creative/ideas/${b.themeSlug}`}
                    className="text-brand-700 hover:underline"
                    >
                      {b.themeSlug}
                    </Link>
                  </>
                ) : null}
              </p>
              {b.hooks?.[0] && (
                <p className="mt-2 line-clamp-1 text-sm italic text-gray-600">“{b.hooks[0]}”</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyPrompt(b)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {copiedId === b.id ? 'Copied' : 'Copy prompt'}
              </button>
              {b.status !== 'prompted' && (
                <button
                  type="button"
                  onClick={() => copyAndMark(b)}
                  disabled={busyId === b.id}
                  className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {busyId === b.id ? '…' : 'Copy & mark prompted'}
                </button>
              )}
              {b.status === 'briefed' && (
                <button
                  type="button"
                  onClick={() => markPrompted(b)}
                  disabled={busyId === b.id}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Mark prompted
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
