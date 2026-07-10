import { useState } from 'react'
import { api } from '../../api'

export default function ScriptsTab({ business, reload }) {
  const [greeting, setGreeting] = useState(business.greeting || '')
  const [systemPrompt, setSystemPrompt] = useState(business.systemPrompt || '')
  const [upsellScript, setUpsellScript] = useState(business.upsellScript || '')
  const [knowledge, setKnowledge] = useState(
    Array.isArray(business.knowledgePack) ? business.knowledgePack : []
  )
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await api(`/api/voice/businesses/${business.id}`, {
        method: 'PATCH',
        body: {
          greeting: greeting || null,
          systemPrompt: systemPrompt || null,
          upsellScript: upsellScript || null,
          knowledgePack: knowledge.filter((k) => k.topic.trim() || k.content.trim()),
        },
      })
      setMessage('Scripts saved')
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const setKnowledgeField = (i, key, value) => {
    setKnowledge(knowledge.map((k, idx) => (idx === i ? { ...k, [key]: value } : k)))
  }

  return (
    <div className="max-w-3xl space-y-6">
      {message && <div className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Greeting</h2>
        <p className="mt-1 text-sm text-gray-500">The first thing callers hear.</p>
        <input
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder={`Hi! Thanks for calling ${business.name}. How can I help?`}
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">System prompt</h2>
        <p className="mt-1 text-sm text-gray-500">
          Who the agent is and how it should behave — e.g. "a warm, knowledgeable guide for new and expecting parents."
        </p>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
        />
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Upsell script</h2>
        <p className="mt-1 text-sm text-gray-500">
          When and how to recommend products — e.g. "if the caller mentions car travel, suggest the car seat and offer to text a link."
        </p>
        <textarea
          value={upsellScript}
          onChange={(e) => setUpsellScript(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
        />
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Knowledge pack</h2>
            <p className="mt-1 text-sm text-gray-500">Topic-by-topic facts the agent can draw on.</p>
          </div>
          <button
            onClick={() => setKnowledge([...knowledge, { topic: '', content: '' }])}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            + Add topic
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {knowledge.length === 0 && <div className="text-sm text-gray-400">No topics yet.</div>}
          {knowledge.map((k, i) => (
            <div key={i} className="rounded-md border border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  value={k.topic}
                  onChange={(e) => setKnowledgeField(i, 'topic', e.target.value)}
                  placeholder="Topic (e.g. Third trimester sleep)"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
                <button
                  onClick={() => setKnowledge(knowledge.filter((_, idx) => idx !== i))}
                  className="shrink-0 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={k.content}
                onChange={(e) => setKnowledgeField(i, 'content', e.target.value)}
                placeholder="What the agent should know about this topic…"
                rows={3}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save scripts'}
      </button>
    </div>
  )
}
