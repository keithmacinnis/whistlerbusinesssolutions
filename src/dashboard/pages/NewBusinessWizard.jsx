import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { parseProductCsv } from '../csv'

const STEPS = ['Name', 'Phone', 'Catalog', 'Prompt', 'Voice', 'Launch']

export default function NewBusinessWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('')
  const [areaCode, setAreaCode] = useState('')
  const [wantNumber, setWantNumber] = useState(true)
  const [csv, setCsv] = useState(null) // { products, errors }
  const [systemPrompt, setSystemPrompt] = useState('')
  const [greeting, setGreeting] = useState('')
  const [appFunnelUrl, setAppFunnelUrl] = useState('')
  const [voices, setVoices] = useState([])
  const [voiceKey, setVoiceKey] = useState('')

  useEffect(() => {
    api('/api/voice/voices').then(({ voices }) => setVoices(voices)).catch(() => {})
  }, [])

  const launch = async (goLive) => {
    setError('')
    setBusy(true)
    try {
      const { business } = await api('/api/voice/businesses', { method: 'POST', body: { name } })

      const [voiceProvider, voiceId] = voiceKey ? voiceKey.split(':') : [null, null]
      await api(`/api/voice/businesses/${business.id}`, {
        method: 'PATCH',
        body: {
          systemPrompt: systemPrompt || null,
          greeting: greeting || null,
          appFunnelUrl: appFunnelUrl || null,
          voiceProvider,
          voiceId,
        },
      })

      if (csv?.products?.length) {
        await api(`/api/voice/businesses/${business.id}/products/import`, {
          method: 'POST',
          body: { products: csv.products },
        })
      }
      if (wantNumber) {
        await api(`/api/voice/businesses/${business.id}/phone-number`, {
          method: 'POST',
          body: { areaCode: areaCode || undefined },
        })
      }
      if (goLive) {
        await api(`/api/voice/businesses/${business.id}/publish`, { method: 'POST' })
      }
      navigate(`/businesses/${business.id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const canNext = [
    name.trim().length > 0, // Name
    true, // Phone
    !csv || csv.errors.length === 0, // Catalog
    true, // Prompt
    true, // Voice
  ][step]

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Add New Business</h1>

      <div className="mt-4 mb-8 flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i < step ? 'bg-green-600 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <div className={`mt-1 text-xs ${i === step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{label}</div>
          </div>
        ))}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg bg-white p-6 shadow-sm">
        {step === 0 && (
          <div>
            <h2 className="font-semibold text-gray-900">What's this line called?</h2>
            <p className="mt-1 text-sm text-gray-500">e.g. "BabyLine" — the agent introduces itself with this name.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-semibold text-gray-900">Phone number</h2>
            <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={wantNumber} onChange={(e) => setWantNumber(e.target.checked)} />
              Request a number now
            </label>
            {wantNumber && (
              <input
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="Preferred area code (optional, e.g. 604)"
                className="mt-3 w-56 rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-semibold text-gray-900">Product catalog</h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload a CSV of affiliate products (columns: name, partnerUrl, price, commissionPct). You can also skip this and add products later.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                const file = e.target.files[0]
                if (file) setCsv(parseProductCsv(await file.text()))
              }}
              className="mt-4 text-sm"
            />
            {csv && (
              <div className="mt-3 text-sm">
                {csv.errors.length > 0 ? (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-red-700">
                    {csv.errors.map((e) => (
                      <div key={e.row}>Row {e.row}: {e.error}</div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-green-50 px-3 py-2 text-green-700">
                    {csv.products.length} product(s) ready — first: {csv.products[0]?.name}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">What should this service do?</h2>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                placeholder="e.g. Answer questions about pregnancy and newborn care with warmth and evidence-based information; recommend relevant products when helpful."
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Greeting
              <input
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder={`Hi! Thanks for calling ${name || 'us'}. How can I help?`}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              App funnel link (optional)
              <input
                value={appFunnelUrl}
                onChange={(e) => setAppFunnelUrl(e.target.value)}
                placeholder="https://birdnestfamilies.com/app"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-semibold text-gray-900">Pick a voice</h2>
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
                    <input type="radio" name="voice" checked={voiceKey === key} onChange={() => setVoiceKey(key)} />
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
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-semibold text-gray-900">Review & launch</h2>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ['Name', name],
                ['Phone', wantNumber ? `New number${areaCode ? ` (area code ${areaCode})` : ''}` : 'None yet'],
                ['Products', csv?.products?.length ? `${csv.products.length} from CSV` : 'None yet'],
                ['Voice', voiceKey ? voices.find((v) => `${v.provider}:${v.voiceId}` === voiceKey)?.name : 'Default (Rachel)'],
                ['Prompt', systemPrompt ? `${systemPrompt.slice(0, 80)}…` : 'Default'],
              ].map(([label, value]) => (
                <div key={label} className="flex">
                  <dt className="w-28 shrink-0 text-gray-500">{label}</dt>
                  <dd className="text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => launch(true)}
                disabled={busy}
                className="rounded-md bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {busy ? 'Launching…' : '🚀 Launch'}
              </button>
              <button
                onClick={() => launch(false)}
                disabled={busy}
                className="rounded-md border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Save as draft
              </button>
            </div>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => (step === 0 ? navigate('/businesses') : setStep(step - 1))}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
