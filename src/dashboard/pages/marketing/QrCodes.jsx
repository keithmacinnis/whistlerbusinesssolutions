import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useAuth } from '../../auth'
import { useViewAsAmbassador } from '../../viewAsAmbassador'
import { hasRole } from '../../roles'

const emptyAppStore = {
  type: 'app_store',
  name: '',
  appId: '6759182700',
  providerToken: '117854023',
  mediaType: '8',
  notes: '',
  ambassadorId: '',
}

const emptyWebsite = {
  type: 'website',
  name: '',
  baseUrl: 'https://www.birdnestfamilies.com',
  utmSource: 'qr',
  utmMedium: 'print',
  utmCampaign: '',
  utmContent: '',
  utmTerm: '',
  notes: '',
}

function previewUrl(form) {
  if (form.type === 'app_store') {
    const ct = encodeURIComponent(form.name.trim() || 'campaign')
    const id = encodeURIComponent(form.appId || '6759182700')
    const pt = encodeURIComponent(form.providerToken || '117854023')
    const mt = encodeURIComponent(form.mediaType || '8')
    return `https://apps.apple.com/app/apple-store/id${id}?pt=${pt}&ct=${ct}&mt=${mt}`
  }
  try {
    const url = new URL(form.baseUrl || 'https://example.com')
    const campaign = form.utmCampaign || form.name
    if (form.utmSource) url.searchParams.set('utm_source', form.utmSource)
    if (form.utmMedium) url.searchParams.set('utm_medium', form.utmMedium)
    if (campaign) url.searchParams.set('utm_campaign', campaign)
    if (form.utmContent) url.searchParams.set('utm_content', form.utmContent)
    if (form.utmTerm) url.searchParams.set('utm_term', form.utmTerm)
    return url.toString()
  } catch {
    return ''
  }
}

function CampaignQr({ url, name }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !url) return
    QRCode.toCanvas(canvasRef.current, url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 220,
      color: { dark: '#111827', light: '#ffffff' },
    }).catch(() => {})
  }, [url])

  const download = async () => {
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 1024,
      color: { dark: '#111827', light: '#ffffff' },
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${name || 'campaign'}.png`
    a.click()
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      <canvas ref={canvasRef} className="rounded-md border border-gray-100 bg-white" />
      <button
        type="button"
        onClick={download}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Download PNG
      </button>
    </div>
  )
}

function typeLabel(type) {
  return type === 'app_store' ? 'App Store' : 'Website'
}

export default function QrCodes() {
  const { user } = useAuth()
  const { viewAs: viewAsAmb } = useViewAsAmbassador()
  const [campaigns, setCampaigns] = useState(null)
  const [qrRequests, setQrRequests] = useState([])
  const [ambassadors, setAmbassadors] = useState([])
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyAppStore)
  const [copiedId, setCopiedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fulfillingId, setFulfillingId] = useState(null)

  const isSuper = hasRole(user, 'super_admin')
  const canAccessMarketing = isSuper || hasRole(user, 'ambassador')
  // Assigning campaigns to sellers is admin-only (disabled for ambassadors / god-mode).
  const canAssignAmbassador = isSuper && !viewAsAmb

  const reload = useCallback(() => {
    if (!canAccessMarketing) return
    const tasks = [api('/api/marketing/campaigns')]
    if (canAssignAmbassador) {
      tasks.push(
        api('/api/ambassadors/admin/qr-requests?status=pending'),
        api('/api/ambassadors')
      )
    }
    Promise.all(tasks)
      .then(([camp, reqs, ambs]) => {
        setCampaigns(camp.campaigns || [])
        setQrRequests(canAssignAmbassador ? reqs?.requests || [] : [])
        setAmbassadors(canAssignAmbassador ? ambs?.ambassadors || [] : [])
      })
      .catch((err) => setError(err.message))
  }, [canAccessMarketing, canAssignAmbassador])

  useEffect(reload, [reload])

  const setType = (type) => {
    setForm(type === 'app_store' ? { ...emptyAppStore, name: form.name, notes: form.notes } : { ...emptyWebsite, name: form.name, notes: form.notes, utmCampaign: form.name })
  }

  const create = async () => {
    setError('')
    setSaving(true)
    try {
      const body =
        form.type === 'app_store'
          ? {
              type: 'app_store',
              name: form.name.trim(),
              appId: form.appId,
              providerToken: form.providerToken,
              campaignToken: form.name.trim(),
              mediaType: form.mediaType,
              notes: form.notes,
              ...(canAssignAmbassador && form.ambassadorId
                ? { ambassadorId: form.ambassadorId }
                : {}),
            }
          : {
              type: 'website',
              name: form.name.trim(),
              baseUrl: form.baseUrl,
              utmSource: form.utmSource,
              utmMedium: form.utmMedium,
              utmCampaign: form.utmCampaign || form.name.trim(),
              utmContent: form.utmContent,
              utmTerm: form.utmTerm,
              notes: form.notes,
            }
      await api('/api/marketing/campaigns', { method: 'POST', body })
      setAdding(false)
      setForm(emptyAppStore)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const fulfillRequest = async (request) => {
    setError('')
    setFulfillingId(request.id)
    try {
      await api(`/api/ambassadors/admin/qr-requests/${request.id}/fulfill`, {
        method: 'POST',
        body: { campaignToken: request.ambassador?.code },
      })
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setFulfillingId(null)
    }
  }

  const assignCampaign = async (campaignId, ambassadorId) => {
    setError('')
    try {
      await api(`/api/marketing/campaigns/${campaignId}/assign`, {
        method: 'POST',
        body: { ambassadorId: ambassadorId || null },
      })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this campaign?')) return
    try {
      await api(`/api/marketing/campaigns/${id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const copyLink = async (campaign) => {
    try {
      await navigator.clipboard.writeText(campaign.targetUrl)
      setCopiedId(campaign.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  if (!canAccessMarketing) {
    return <div className="text-gray-500">Marketing tools are limited to admins and ambassadors.</div>
  }

  const livePreview = previewUrl(form)
  const canSave =
    form.name.trim().length > 0 &&
    (form.type === 'app_store' || (form.baseUrl && livePreview))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign tracking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create App Store or website campaign links with downloadable QR codes for print, ads, and bios.
            {canAssignAmbassador
              ? ' Assign App Store campaigns when a family seller requests install tracking.'
              : ' Personal seller links and QRs also live under Links & QR.'}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyAppStore)
            setAdding(true)
          }}
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New campaign
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {qrRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Pending App Store QR requests
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {qrRequests.map((r) => (
              <div key={r.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="font-semibold text-gray-900">
                  {r.ambassador?.displayName || r.ambassador?.user?.name || 'Ambassador'}
                </div>
                <div className="mt-0.5 font-mono text-xs text-gray-600">
                  code={r.ambassador?.code} · {r.ambassador?.user?.email}
                </div>
                {r.note && <p className="mt-2 text-sm text-gray-600">{r.note}</p>}
                <p className="mt-2 text-xs text-gray-500">
                  Fulfill creates/updates an App Store campaign with ct=
                  {r.ambassador?.code} and syncs their install link.
                </p>
                <button
                  type="button"
                  disabled={fulfillingId === r.id}
                  onClick={() => fulfillRequest(r)}
                  className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {fulfillingId === r.id ? 'Assigning…' : 'Assign App Store QR'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!campaigns && !error && <div className="text-gray-500">Loading…</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {campaigns?.map((c) => (
          <div key={c.id} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{c.name}</h2>
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {typeLabel(c.type)}
                </span>
                {c.ambassador && (
                  <div className="mt-1 text-xs text-brand-700">
                    Assigned: {c.ambassador.displayName || c.ambassador.user?.email || c.ambassador.code}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(c.id)}
                className="text-xs text-gray-400 hover:text-red-600"
                title="Delete campaign"
              >
                Delete
              </button>
            </div>
            {c.notes && <p className="mt-2 text-sm text-gray-500">{c.notes}</p>}
            <div className="mt-3 break-all rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
              {c.targetUrl}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyLink(c)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {copiedId === c.id ? 'Copied' : 'Copy link'}
              </button>
              <a
                href={c.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Open ↗
              </a>
            </div>
            {c.type === 'app_store' && (
              <label className="mt-3 block text-xs font-medium text-gray-500">
                Assign to ambassador
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                  value={c.ambassadorId || ''}
                  disabled={!canAssignAmbassador}
                  onChange={(e) => assignCampaign(c.id, e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {ambassadors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName || a.user?.name || a.code} ({a.code})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <CampaignQr url={c.targetUrl} name={c.name} />
          </div>
        ))}
      </div>

      {campaigns?.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No campaigns yet. Create an App Store or website campaign to generate a QR code.
        </div>
      )}

      {adding && (
        <Modal title="Generate a campaign link" onClose={() => setAdding(false)} wide>
          <p className="mb-4 text-sm text-gray-500">
            To measure campaign performance, generate a tracking link for ads, promotions, and print.
            App Store links use Apple&apos;s <code className="text-xs">pt</code>/<code className="text-xs">ct</code>{' '}
            parameters; website links use UTM tags.
          </p>

          <div className="mb-4 flex gap-2">
            {[
              { id: 'app_store', label: 'App Store' },
              { id: 'website', label: 'Website' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  form.type === opt.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Campaign name *
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.replace(/\s+/g, '') })}
                placeholder="e.g. businesscard001"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs font-normal text-gray-400">
                {form.type === 'app_store'
                  ? 'Used as Apple’s campaign token (ct=). No spaces.'
                  : 'Used as the default utm_campaign value. No spaces.'}
              </span>
            </label>

            {form.type === 'app_store' ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block text-sm font-medium text-gray-700">
                    App ID
                    <input
                      value={form.appId}
                      onChange={(e) => setForm({ ...form, appId: e.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Provider token (pt)
                    <input
                      value={form.providerToken}
                      onChange={(e) => setForm({ ...form, providerToken: e.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Media type (mt)
                    <input
                      value={form.mediaType}
                      onChange={(e) => setForm({ ...form, mediaType: e.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign to ambassador (optional)
                  <select
                    value={form.ambassadorId || ''}
                    disabled={!canAssignAmbassador}
                    onChange={(e) => setForm({ ...form, ambassadorId: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">— None —</option>
                    {ambassadors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.displayName || a.user?.name || a.code} ({a.code})
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  Destination URL *
                  <input
                    value={form.baseUrl}
                    onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                    placeholder="https://www.birdnestfamilies.com"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-gray-700">
                    utm_source
                    <input
                      value={form.utmSource}
                      onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    utm_medium
                    <input
                      value={form.utmMedium}
                      onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    utm_campaign
                    <input
                      value={form.utmCampaign}
                      onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })}
                      placeholder="defaults to campaign name"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    utm_content
                    <input
                      value={form.utmContent}
                      onChange={(e) => setForm({ ...form, utmContent: e.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </label>
                </div>
              </>
            )}

            <label className="block text-sm font-medium text-gray-700">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional — e.g. business cards, spring flyer"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Preview link</div>
              <div className="mt-1 break-all rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                {livePreview || '—'}
              </div>
            </div>

            <button
              onClick={create}
              disabled={!canSave || saving}
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create campaign & QR'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
