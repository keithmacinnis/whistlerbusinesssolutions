import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'
import CreativeStudioTabs from './CreativeStudioTabs'
import CreativeStudioGuide from './CreativeStudioGuide'
import { ToneChip } from './ToneBanner'

const STATUS_STYLES = {
  idea: 'bg-gray-100 text-gray-700',
  briefed: 'bg-blue-50 text-blue-700',
  prompted: 'bg-emerald-50 text-emerald-700',
  ready_to_post: 'bg-violet-50 text-violet-800',
  posted: 'bg-sky-50 text-sky-800',
  archived: 'bg-amber-50 text-amber-800',
}

const STATUS_LABELS = {
  idea: 'idea',
  briefed: 'briefed',
  prompted: 'prompted',
  ready_to_post: 'ready to post',
  posted: 'posted',
  archived: 'archived',
}

function formatLabel(slug) {
  return (
    {
      story_post: 'Story post',
      meme_still: 'Meme still',
      caption_pack: 'Caption pack',
    }[slug] || slug
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatBytes(n) {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

const emptyFlip = {
  briefId: '',
  title: '',
  format: 'story_post',
  bodyText: '',
  externalUrl: '',
  notes: '',
  file: null,
  nextCut: null,
}

export default function CreativeText() {
  const { user } = useAuth()
  const [stills, setStills] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [flipped, setFlipped] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [showFlip, setShowFlip] = useState(false)
  const [flip, setFlip] = useState(emptyFlip)

  const reload = useCallback(() => {
    api('/api/marketing/creative/stills/board')
      .then(({ stills: s, candidates: c, flipped: f }) => {
        setStills(s || [])
        setCandidates(c || [])
        setFlipped(f || [])
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const openFlip = (brief, { nextCut } = {}) => {
    const cut = nextCut || brief?.nextCut || null
    const baseTitle = brief?.title || ''
    setFlip({
      ...emptyFlip,
      briefId: brief?.id || '',
      title: cut && cut > 1 ? `${baseTitle} (cut ${cut})` : baseTitle,
      format: brief?.format || 'story_post',
      bodyText: '',
      nextCut: cut,
    })
    setShowFlip(true)
    setError('')
  }

  const copyPrompt = async (brief) => {
    try {
      await navigator.clipboard.writeText(brief.generationPrompt || '')
      setCopiedId(brief.id)
      setTimeout(() => setCopiedId(''), 1500)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  const copyBody = async (still) => {
    try {
      await navigator.clipboard.writeText(still.bodyText || '')
      setCopiedId(still.id)
      setTimeout(() => setCopiedId(''), 1500)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  const downloadStill = async (still) => {
    setError('')
    try {
      const { url } = await api(`/api/marketing/creative/stills/${still.id}/play-url`, {
        params: { download: '1' },
      })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err.message)
    }
  }

  const archiveStill = async (still) => {
    if (!confirm(`Archive “${still.title}”?`)) return
    setBusyId(still.id)
    setError('')
    try {
      await api(`/api/marketing/creative/stills/${still.id}/archive`, { method: 'POST' })
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  const submitFlip = async () => {
    setSaving(true)
    setError('')
    try {
      const body = {
        briefId: flip.briefId || undefined,
        title: flip.title.trim() || undefined,
        format: flip.format,
        bodyText: flip.bodyText.trim() || undefined,
        externalUrl: flip.externalUrl.trim() || undefined,
        notes: flip.notes.trim() || undefined,
      }
      if (flip.file) {
        if (flip.file.size > 20 * 1024 * 1024) {
          throw new Error('Image too large (max 20MB). Paste a link instead.')
        }
        body.contentBase64 = await fileToBase64(flip.file)
        body.filename = flip.file.name
        body.mimeType = flip.file.type || 'image/jpeg'
      }
      if (!body.contentBase64 && !body.externalUrl && !body.bodyText) {
        throw new Error('Add final caption text, an image, or a link')
      }
      await api('/api/marketing/creative/stills', { method: 'POST', body })
      setShowFlip(false)
      setFlip(emptyFlip)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Marketing tools are limited to super admins.</div>
  }

  const loading = stills === null && !error

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Studio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Flip story posts & meme stills into publishable text + image — then Post when ready.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openFlip(null)}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add text/still
        </button>
      </div>
      <CreativeStudioTabs />
      <CreativeStudioGuide focus="text" />

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {loading && <div className="text-gray-500">Loading…</div>}

      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Text & stills</h2>
            <p className="text-sm text-gray-500">
              Finished captions and images. Download the asset or archive when done.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400">{stills?.length || 0}</span>
        </div>

        {stills?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="font-medium text-gray-800">No text/stills yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Flip a story post or meme brief below.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {stills?.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/40 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-gray-900">{s.title}</h3>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-900">
                    {formatLabel(s.format)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(s.createdAt).toLocaleString()}
                  {s.filename ? ` · ${s.filename}` : ''}
                  {s.sizeBytes != null ? ` · ${formatBytes(s.sizeBytes)}` : ''}
                  {s.brief ? (
                    <>
                      {' · '}
                      <Link
                        to={`/marketing/creative/${s.brief.id}`}
                        className="text-brand-700 hover:underline"
                      >
                        {s.brief.title}
                      </Link>
                    </>
                  ) : null}
                </p>
                {s.bodyText && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{s.bodyText}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {s.bodyText && (
                  <button
                    type="button"
                    onClick={() => copyBody(s)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {copiedId === s.id ? 'Copied' : 'Copy caption'}
                  </button>
                )}
                {(s.hasFile || s.hasLink) && (
                  <button
                    type="button"
                    onClick={() => downloadStill(s)}
                    className="rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800"
                  >
                    {s.hasFile ? 'Download image' : 'Open link'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => archiveStill(s)}
                  disabled={busyId === s.id}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ready to flip</h2>
            <p className="text-sm text-gray-500">
              Story posts & meme stills waiting for a final caption / image.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400">{candidates.length}</span>
        </div>

        {candidates.length === 0 && stills !== null && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
            No new text briefs waiting — generate a Story post or Meme still from Briefs / Ideas.
          </div>
        )}

        <div className="space-y-3">
          {candidates.map((b) => (
            <BriefRow
              key={b.id}
              brief={b}
              copiedId={copiedId}
              onCopy={copyPrompt}
              primaryLabel="Flip to text"
              onPrimary={() => openFlip(b, { nextCut: 1 })}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Flipped</h2>
            <p className="text-sm text-gray-500">
              Briefs already turned into at least one still — make another anytime.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400">{flipped.length}</span>
        </div>

        {flipped.length === 0 && stills !== null && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
            Nothing flipped yet.
          </div>
        )}

        <div className="space-y-3">
          {flipped.map((b) => (
            <BriefRow
              key={b.id}
              brief={b}
              copiedId={copiedId}
              onCopy={copyPrompt}
              meta={`${b.stillCount} still${b.stillCount === 1 ? '' : 's'} so far`}
              primaryLabel={`Make a ${ordinal(b.nextCut)} still`}
              onPrimary={() => openFlip(b, { nextCut: b.nextCut })}
            />
          ))}
        </div>
      </section>

      {showFlip && (
        <Modal
          title={
            flip.nextCut && flip.nextCut > 1
              ? `Make a ${ordinal(flip.nextCut)} still`
              : flip.briefId
                ? 'Flip brief → text/still'
                : 'Add text/still'
          }
          onClose={() => !saving && setShowFlip(false)}
          wide
        >
          <p className="mb-4 text-sm text-gray-500">
            Save the final caption and/or image (upload preferred, max 20MB). Head to Post when
            it’s live-ready.
          </p>
          <div className="space-y-3">
            {!flip.briefId && (
              <label className="block text-sm font-medium text-gray-700">
                Format
                <select
                  value={flip.format}
                  onChange={(e) => setFlip({ ...flip, format: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="story_post">Story post</option>
                  <option value="meme_still">Meme still</option>
                  <option value="caption_pack">Caption pack</option>
                </select>
              </label>
            )}
            <label className="block text-sm font-medium text-gray-700">
              Title
              <input
                value={flip.title}
                onChange={(e) => setFlip({ ...flip, title: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Final caption / overlay text
              <textarea
                value={flip.bodyText}
                onChange={(e) => setFlip({ ...flip, bodyText: e.target.value })}
                rows={5}
                placeholder="Paste the publishable caption (or meme overlay line)"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Upload image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFlip({ ...flip, file: e.target.files?.[0] || null })}
                className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              />
              {flip.file && (
                <p className="mt-1 text-xs text-gray-500">
                  {flip.file.name} · {formatBytes(flip.file.size)}
                </p>
              )}
            </label>
            <label className="block text-sm font-medium text-gray-700">
              External image link
              <input
                value={flip.externalUrl}
                onChange={(e) => setFlip({ ...flip, externalUrl: e.target.value })}
                placeholder="https://…"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Notes
              <textarea
                value={flip.notes}
                onChange={(e) => setFlip({ ...flip, notes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={submitFlip}
              disabled={saving}
              className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save text/still'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function BriefRow({ brief: b, copiedId, onCopy, onPrimary, primaryLabel, meta }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
            {STATUS_LABELS[b.status] || b.status}
          </span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-800">
            {formatLabel(b.format)}
          </span>
          <ToneChip tone={b.meta?.toneAnalysis} />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {b.angle}
          {meta ? ` · ${meta}` : ''}
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
          onClick={() => onCopy(b)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copiedId === b.id ? 'Copied' : 'Copy prompt'}
        </button>
        <button
          type="button"
          onClick={onPrimary}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  )
}
