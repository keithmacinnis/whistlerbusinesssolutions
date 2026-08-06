import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'
import CreativeStudioTabs from './CreativeStudioTabs'
import CreativeStudioGuide from './CreativeStudioGuide'

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'x', label: 'X.com' },
]

function platformLabel(id) {
  if (id === 'other') return 'X.com'
  return PLATFORMS.find((p) => p.id === id)?.label || id || '—'
}

function formatBytes(n) {
  if (n == null) return ''
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function CreativePosts() {
  const { user } = useAuth()
  const [ready, setReady] = useState(null)
  const [posted, setPosted] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPost, setShowPost] = useState(false)
  const [form, setForm] = useState({
    videoId: '',
    videoTitle: '',
    platform: 'tiktok',
    postUrl: '',
    notes: '',
    postedAt: '',
  })

  const reload = useCallback(() => {
    api('/api/marketing/creative/posts/board')
      .then(({ ready: r, posted: p }) => {
        setReady(r || [])
        setPosted(p || [])
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const openPost = (video) => {
    setForm({
      videoId: video.id,
      videoTitle: video.title,
      platform: 'tiktok',
      postUrl: '',
      notes: '',
      postedAt: new Date().toISOString().slice(0, 16),
    })
    setShowPost(true)
    setError('')
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

  const submitPost = async () => {
    setSaving(true)
    setError('')
    try {
      await api('/api/marketing/creative/posts', {
        method: 'POST',
        body: {
          videoId: form.videoId,
          platform: form.platform || undefined,
          postUrl: form.postUrl.trim() || undefined,
          notes: form.notes.trim() || undefined,
          postedAt: form.postedAt ? new Date(form.postedAt).toISOString() : undefined,
        },
      })
      setShowPost(false)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removePost = async (post) => {
    if (!confirm('Remove this post record? (The video file stays.)')) return
    setBusyId(post.id)
    setError('')
    try {
      await api(`/api/marketing/creative/posts/${post.id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  if (user?.role !== 'super_admin') {
    return <div className="text-gray-500">Marketing tools are limited to super admins.</div>
  }

  const loading = ready === null && !error

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Creative Studio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Publish uploaded cuts. The same video can be posted more than once (TikTok + Reels, etc.).
        </p>
      </div>
      <CreativeStudioTabs />
      <CreativeStudioGuide focus="posts" />

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {loading && <div className="text-gray-500">Loading…</div>}

      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ready to post</h2>
            <p className="text-sm text-gray-500">
              Uploaded videos waiting to go live — post the same cut to multiple platforms.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400">{ready?.length || 0}</span>
        </div>

        {ready?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="font-medium text-gray-800">Nothing ready to post</p>
            <p className="mt-1 text-sm text-gray-500">Flip and upload a video first.</p>
            <Link
              to="/marketing/creative/videos"
              className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
            >
              Go to Videos →
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {ready?.map((v) => (
            <div
              key={v.id}
              className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-gray-900">{v.title}</h3>
                  {v.postCount > 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-800">
                      Posted {v.postCount}×
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(v.createdAt).toLocaleString()}
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
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadVideo(v)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {v.hasFile ? 'Download' : 'Open link'}
                </button>
                <button
                  type="button"
                  onClick={() => openPost(v)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {v.postCount > 0 ? 'Post again' : 'Mark posted'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Posted</h2>
            <p className="text-sm text-gray-500">Publishing history — one row per post event.</p>
          </div>
          <span className="text-xs font-medium text-gray-400">{posted.length}</span>
        </div>

        {posted.length === 0 && ready !== null && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
            No posts recorded yet.
          </div>
        )}

        <div className="space-y-3">
          {posted.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-gray-900">
                    {p.video?.title || 'Video'}
                  </h3>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-sky-800">
                    {platformLabel(p.platform)}
                  </span>
                  {p.postNumber != null && (
                    <span className="text-[11px] font-medium text-gray-400">
                      post #{p.postNumber}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(p.postedAt).toLocaleString()}
                  {p.postUrl ? (
                    <>
                      {' · '}
                      <a
                        href={p.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-700 hover:underline"
                      >
                        View post
                      </a>
                    </>
                  ) : null}
                </p>
                {p.notes && <p className="mt-1 text-sm text-gray-600">{p.notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => removePost(p)}
                disabled={busyId === p.id}
                className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Remove record
              </button>
            </div>
          ))}
        </div>
      </section>

      {showPost && (
        <Modal title="Record a post" onClose={() => !saving && setShowPost(false)} wide>
          <p className="mb-4 text-sm text-gray-500">
            Logging a publish for <strong>{form.videoTitle}</strong>. You can record another post for
            the same video anytime.
          </p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Platform
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Post URL (optional)
              <input
                value={form.postUrl}
                onChange={(e) => setForm({ ...form, postUrl: e.target.value })}
                placeholder="https://…"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Posted at
              <input
                type="datetime-local"
                value={form.postedAt}
                onChange={(e) => setForm({ ...form, postedAt: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="e.g. TikTok ads account, spark ads"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={submitPost}
              disabled={saving}
              className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save post'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
