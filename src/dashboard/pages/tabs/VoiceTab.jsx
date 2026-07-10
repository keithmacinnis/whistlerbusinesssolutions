import { useEffect, useState } from 'react'
import { api } from '../../api'

export default function VoiceTab({ business, reload }) {
  const [voices, setVoices] = useState([])
  const [voiceKey, setVoiceKey] = useState(
    business.voiceId ? `${business.voiceProvider}:${business.voiceId}` : ''
  )
  const [appFunnelUrl, setAppFunnelUrl] = useState(business.appFunnelUrl || '')
  const [areaCode, setAreaCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/api/voice/voices')
      .then(({ voices }) => setVoices(voices))
      .catch((err) => setError(err.message))
  }, [])

  const saveConfig = async () => {
    setError('')
    setMessage('')
    const [voiceProvider, voiceId] = voiceKey ? voiceKey.split(':') : [null, null]
    try {
      await api(`/api/voice/businesses/${business.id}`, {
        method: 'PATCH',
        body: { voiceProvider, voiceId, appFunnelUrl: appFunnelUrl || null },
      })
      setMessage('Voice settings saved')
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const requestNumber = async () => {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const { business: updated } = await api(`/api/voice/businesses/${business.id}/phone-number`, {
        method: 'POST',
        body: { areaCode: areaCode || undefined },
      })
      setMessage(`Number assigned: ${updated.phoneNumber}`)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const { stub } = await api(`/api/voice/businesses/${business.id}/publish`, { method: 'POST' })
      setMessage(stub ? 'Published (stub mode — no live Vapi account connected yet)' : 'Published live!')
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {message && <div className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Voice</h2>
        <div className="mt-3 space-y-2">
          {voices.map((v) => {
            const key = `${v.provider}:${v.voiceId}`
            return (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                  voiceKey === key ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="voice"
                  checked={voiceKey === key}
                  onChange={() => setVoiceKey(key)}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {v.name} <span className="text-xs text-gray-400">({v.provider})</span>
                  </div>
                  <div className="text-sm text-gray-500">{v.description}</div>
                </div>
              </label>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Phone number</h2>
        {business.phoneNumber ? (
          <div className="mt-2 text-lg font-medium text-gray-900">📞 {business.phoneNumber}</div>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="Area code (e.g. 604)"
              className="w-44 rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
            <button
              onClick={requestNumber}
              disabled={busy}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Request number
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">App funnel link</h2>
        <p className="mt-1 text-sm text-gray-500">Where the agent sends callers who want the app (texted after the call).</p>
        <input
          value={appFunnelUrl}
          onChange={(e) => setAppFunnelUrl(e.target.value)}
          placeholder="https://birdnestfamilies.com/app"
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </section>

      <div className="flex gap-3">
        <button
          onClick={saveConfig}
          className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
        >
          Save settings
        </button>
        <button
          onClick={publish}
          disabled={busy}
          className="rounded-md bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {business.status === 'live' ? 'Republish changes' : 'Launch'}
        </button>
      </div>
    </div>
  )
}
