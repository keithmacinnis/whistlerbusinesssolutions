import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'
import CreativeStudioTabs from './CreativeStudioTabs'
import CreativeStudioGuide from './CreativeStudioGuide'
import { ToneChip } from './ToneBanner'
import AssetPreview from './AssetPreview'

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
      micro_reaction: 'Micro reaction',
      talking_head_screen: 'Talking head + screen',
      seedance_oner: 'Seedance one-take',
      caption_pack: 'Caption pack',
      broll_caption: 'B-roll captions',
      story_post: 'Story post',
      meme_still: 'Meme still',
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
  externalUrl: '',
  notes: '',
  file: null,
  nextCut: null,
}

export default function CreativeVideos() {
  const { user } = useAuth()
  const [videos, setVideos] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [flipped, setFlipped] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [showFlip, setShowFlip] = useState(false)
  const [flip, setFlip] = useState(emptyFlip)

  const reload = useCallback(() => {
    api('/api/marketing/creative/videos/board')
      .then(({ videos: v, candidates: c, flipped: f }) => {
        setVideos(v || [])
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

  const downloadVideo = async (video) => {
    setError('')
    try {
      const { url } = await api(`/api/marketing/creative/videos/${video.id}/play-url`, {
        params: { download: '1' },
      })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err.message)
    }
  }

  const archiveVideo = async (video) => {
    if (!confirm(`Archive “${video.title}”? It leaves Ready to Post.`)) return
    setBusyId(video.id)
    setError('')
    try {
      await api(`/api/marketing/creative/videos/${video.id}/archive`, { method: 'POST' })
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
        externalUrl: flip.externalUrl.trim() || undefined,
        notes: flip.notes.trim() || undefined,
      }
      if (flip.file) {
        if (flip.file.size > 80 * 1024 * 1024) {
          throw new Error('Video too large (max 80MB). Paste a link instead.')
        }
        body.contentBase64 = await fileToBase64(flip.file)
        body.filename = flip.file.name
        body.mimeType = flip.file.type || 'video/mp4'
      }
      if (!body.contentBase64 && !body.externalUrl) {
        throw new Error('Upload a video file or paste an external URL')
      }
      await api('/api/marketing/creative/videos', { method: 'POST', body })
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

  const loading = videos === null && !error

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Studio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Flip briefs into video files — then head to Post when a cut is ready to publish.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openFlip(null)}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add video
        </button>
      </div>
      <CreativeStudioTabs />
      <CreativeStudioGuide focus="videos" />

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {loading && <div className="text-gray-500">Loading…</div>}

      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Videos</h2>
            <p className="text-sm text-gray-500">
              Active cuts. Download the file, or archive when you’re done with it here.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400">{videos?.length || 0}</span>
        </div>

        {videos?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="font-medium text-gray-800">No active videos</p>
            <p className="mt-1 text-sm text-gray-500">Flip a brief below to upload your first cut.</p>
          </div>
        )}

        <div className="space-y-3">
          {videos?.map((v) => (
            <div
              key={v.id}
              className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/40 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-gray-900">{v.title}</h3>
                  {v.hasFile && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-violet-800">
                      Uploaded
                    </span>
                  )}
                  {v.hasLink && !v.hasFile && (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-sky-800">
                      Link only
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(v.createdAt).toLocaleString()}
                  {v.filename ? ` · ${v.filename}` : ''}
                  {v.sizeBytes != null ? ` · ${formatBytes(v.sizeBytes)}` : ''}
                  {v.brief ? (
                    <>
                      {' · '}
                      <Link
                        to={`/marketing/creative/${v.brief.id}`}
                        className="text-brand-700 hover:underline"
                      >
                        {v.brief.title}
                      </Link>
                    </>
                  ) : null}
                </p>
                <AssetPreview
                  assetType="video"
                  id={v.id}
                  title={v.title}
                  hasFile={v.hasFile}
                  hasLink={v.hasLink}
                />
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadVideo(v)}
                  className="rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  {v.hasFile ? 'Download video' : 'Open link'}
                </button>
                <button
                  type="button"
                  onClick={() => archiveVideo(v)}
                  disabled={busyId === v.id}
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
              Briefs that haven’t become a video yet — copy the prompt, make it, upload.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400">{candidates.length}</span>
        </div>

        {candidates.length === 0 && videos !== null && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
            No new briefs waiting — check Flipped below to cut another version.
          </div>
        )}

        <div className="space-y-3">
          {candidates.map((b) => (
            <BriefRow
              key={b.id}
              brief={b}
              copiedId={copiedId}
              busyId={busyId}
              onCopy={copyPrompt}
              onMarkPrompted={markPrompted}
              primaryLabel="Flip to video"
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
              Briefs you’ve already turned into at least one cut — make another anytime.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400">{flipped.length}</span>
        </div>

        {flipped.length === 0 && videos !== null && (
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
              busyId={busyId}
              onCopy={copyPrompt}
              showMarkPrompted={false}
              meta={`${b.videoCount} video${b.videoCount === 1 ? '' : 's'} so far`}
              primaryLabel={`Make a ${ordinal(b.nextCut)} video`}
              onPrimary={() => openFlip(b, { nextCut: b.nextCut })}
            />
          ))}
        </div>
      </section>

      {showFlip && (
        <Modal
          title={
            flip.nextCut && flip.nextCut > 1
              ? `Make a ${ordinal(flip.nextCut)} video`
              : flip.briefId
                ? 'Flip brief → video'
                : 'Add video'
          }
          onClose={() => !saving && setShowFlip(false)}
          wide
        >
          <p className="mb-4 text-sm text-gray-500">
            Upload the finished cut (preferred, max 80MB) or paste a CapCut / Drive / hosting link.
            {flip.briefId ? ' The brief stays available under Flipped for more cuts.' : ''}
          </p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Title
              <input
                value={flip.title}
                onChange={(e) => setFlip({ ...flip, title: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Upload video
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm"
                onChange={(e) => setFlip({ ...flip, file: e.target.files?.[0] || null })}
                className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              />
              {flip.file && (
                <p className="mt-1 text-xs text-gray-500">
                  {flip.file.name} · {formatBytes(flip.file.size)}
                </p>
              )}
            </label>
            <div className="relative py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
              <span className="relative z-10 bg-white px-2">or</span>
              <span className="absolute inset-x-0 top-1/2 border-t border-gray-200" />
            </div>
            <label className="block text-sm font-medium text-gray-700">
              External link
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
              {saving ? 'Saving… (large uploads can take a minute)' : 'Save video'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function BriefRow({
  brief: b,
  copiedId,
  busyId,
  onCopy,
  onMarkPrompted,
  onPrimary,
  primaryLabel,
  showMarkPrompted = true,
  meta,
}) {
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
          <ToneChip tone={b.meta?.toneAnalysis} />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {formatLabel(b.format)} · {b.angle}
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
        {showMarkPrompted && b.status === 'briefed' && onMarkPrompted && (
          <button
            type="button"
            onClick={() => onMarkPrompted(b)}
            disabled={busyId === b.id}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            Mark prompted
          </button>
        )}
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
