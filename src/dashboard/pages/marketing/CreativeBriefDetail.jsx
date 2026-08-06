import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth'
import ToneBanner from './ToneBanner'

const STATUSES = ['idea', 'briefed', 'prompted', 'ready_to_post', 'posted', 'archived']

const STATUS_LABELS = {
  idea: 'idea',
  briefed: 'briefed',
  prompted: 'prompted',
  ready_to_post: 'ready to post',
  posted: 'posted',
  archived: 'archived',
}

const PLATFORM_LABELS = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  x: 'X.com',
  other: 'X.com',
}

function beatsToText(beats) {
  if (!Array.isArray(beats)) return ''
  return beats
    .map((b) => {
      const end = b.endState ? `\n  End state: ${b.endState}` : ''
      return `[${b.range}] ${b.action}${end}`
    })
    .join('\n\n')
}

function parseBeats(text) {
  const chunks = text.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean)
  return chunks.map((chunk) => {
    const lines = chunk.split('\n').map((l) => l.trim())
    const first = lines[0] || ''
    const m = first.match(/^\[([^\]]+)\]\s*(.*)$/)
    const range = m ? m[1] : 'beat'
    const action = m ? m[2] : first
    const endLine = lines.find((l) => /^end state:/i.test(l))
    const endState = endLine ? endLine.replace(/^end state:\s*/i, '') : ''
    return { range, action, endState }
  })
}

export default function CreativeBriefDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [brief, setBrief] = useState(null)
  const [videos, setVideos] = useState([])
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')
  const [dirty, setDirty] = useState(false)
  const [checkingTone, setCheckingTone] = useState(false)

  const load = useCallback(() => {
    api(`/api/marketing/creative/briefs/${id}`)
      .then(({ brief: b, videos: v, posts: p }) => {
        setBrief(b)
        setVideos(v || [])
        setPosts(p || [])
        setForm({
          title: b.title || '',
          status: b.status || 'briefed',
          inputNote: b.inputNote || '',
          hooksText: Array.isArray(b.hooks) ? b.hooks.join('\n') : '',
          beatsText: beatsToText(b.beats),
          onScreenText: Array.isArray(b.onScreenText) ? b.onScreenText.join('\n') : '',
          caption: b.caption || '',
          visualRecipe: b.visualRecipe || '',
          generationPrompt: b.generationPrompt || '',
        })
        setDirty(false)
      })
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(load, [load])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

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
      const hooks = form.hooksText
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean)
      const onScreenText = form.onScreenText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
      const beats = parseBeats(form.beatsText)
      const { brief: updated } = await api(`/api/marketing/creative/briefs/${id}`, {
        method: 'PATCH',
        body: {
          title: form.title.trim(),
          status: form.status,
          inputNote: form.inputNote.trim() || null,
          hooks,
          beats,
          onScreenText: onScreenText.length ? onScreenText : null,
          caption: form.caption.trim() || null,
          visualRecipe: form.visualRecipe.trim() || null,
          generationPrompt: form.generationPrompt.trim() || null,
        },
      })
      setBrief(updated)
      setDirty(false)
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const recheckTone = async () => {
    setCheckingTone(true)
    setError('')
    try {
      if (dirty) await save()
      const { brief: updated } = await api(`/api/marketing/creative/briefs/${id}/analyze-tone`, {
        method: 'POST',
      })
      setBrief(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingTone(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete this brief?')) return
    try {
      await api(`/api/marketing/creative/briefs/${id}`, { method: 'DELETE' })
      navigate('/marketing/creative')
    } catch (err) {
      setError(err.message)
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
        <Link to="/marketing/creative" className="text-sm text-brand-700 hover:underline">
          ← Back to Creative Studio
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/marketing/creative" className="text-sm text-brand-700 hover:underline">
            ← Creative Studio
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{form.title || 'Brief'}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {brief?.offerSlug} · {brief?.angle} · {brief?.format}
            {brief?.themeSlug && (
              <>
                {' · '}
                <Link
                  to={`/marketing/creative/ideas/${brief.themeSlug}`}
                  className="text-brand-700 hover:underline"
                >
                  idea: {brief.themeSlug}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy('hooks', form.hooksText)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied === 'hooks' ? 'Copied' : 'Copy hooks'}
          </button>
          <button
            type="button"
            onClick={() => copy('prompt', form.generationPrompt)}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {copied === 'prompt' ? 'Copied' : 'Copy prompt'}
          </button>
          <Link
            to="/marketing/creative/videos"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Flip on Videos →
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
          <button
            type="button"
            onClick={remove}
            className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <ToneBanner
        tone={brief?.meta?.toneAnalysis}
        onRecheck={recheckTone}
        checking={checkingTone}
      />

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
            Status
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-gray-400">
              <code>prompted</code> = pasted into CapCut; <code>ready to post</code> = video
              uploaded; <code>posted</code> = recorded on Post.
            </span>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Visual recipe
            <textarea
              value={form.visualRecipe}
              onChange={(e) => updateField('visualRecipe', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Input note
            <textarea
              value={form.inputNote}
              onChange={(e) => updateField('inputNote', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Related videos ({videos.length})
              </div>
              <Link
                to="/marketing/creative/videos"
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Videos →
              </Link>
            </div>
            {videos.length === 0 ? (
              <p className="mt-2 text-xs text-gray-400">No videos flipped from this brief yet.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {videos.map((v) => (
                  <li key={v.id} className="rounded-md bg-gray-50 px-2.5 py-2">
                    <div className="font-medium text-gray-900">{v.title}</div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {v.status === 'archived' ? 'archived · ' : ''}
                      {new Date(v.createdAt).toLocaleString()}
                      {v.hasFile ? ' · uploaded' : ''}
                      {v.hasLink ? ' · link' : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Postings ({posts.length})
              </div>
              <Link
                to="/marketing/creative/posts"
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Post →
              </Link>
            </div>
            {posts.length === 0 ? (
              <p className="mt-2 text-xs text-gray-400">
                No posts recorded for videos from this brief yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {posts.map((p) => (
                  <li key={p.id} className="rounded-md bg-white px-2.5 py-2 ring-1 ring-emerald-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {PLATFORM_LABELS[p.platform] || p.platform || 'Post'}
                      </span>
                      {p.video?.title && (
                        <span className="text-xs text-gray-400 truncate max-w-[12rem]">
                          {p.video.title}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
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
                    </div>
                    {p.notes && <p className="mt-1 text-xs text-gray-600">{p.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {brief?.meta?.model && (
            <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Model: {brief.meta.model}
              {brief.meta.usage?.total_tokens != null && (
                <> · {brief.meta.usage.total_tokens} tokens</>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Hooks (one per line)
            <textarea
              value={form.hooksText}
              onChange={(e) => updateField('hooksText', e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Beats
            <textarea
              value={form.beatsText}
              onChange={(e) => updateField('beatsText', e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
            />
            <span className="mt-1 block text-xs font-normal text-gray-400">
              Format: [0–8s] action… then optional “End state: …” on the next line. Separate beats
              with a blank line.
            </span>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            On-screen text (one per line)
            <textarea
              value={form.onScreenText}
              onChange={(e) => updateField('onScreenText', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Caption
            <textarea
              value={form.caption}
              onChange={(e) => updateField('caption', e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Generation prompt (paste-ready)
            <textarea
              value={form.generationPrompt}
              onChange={(e) => updateField('generationPrompt', e.target.value)}
              rows={18}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs leading-relaxed focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
