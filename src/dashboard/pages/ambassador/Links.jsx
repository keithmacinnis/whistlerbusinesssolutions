import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { api } from '../../api'

function LinkQr({ url, name }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !url) return
    QRCode.toCanvas(canvasRef.current, url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 160,
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
    a.download = `qr-${name || 'link'}.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <canvas ref={canvasRef} className="rounded border border-gray-100 bg-white" />
      <button type="button" onClick={download} className="text-xs font-medium text-brand-600 hover:underline">
        Download PNG
      </button>
    </div>
  )
}

const channelLabel = (ch) =>
  ({
    shop: 'Shop (The Adorn List)',
    birdnest: 'BirdNest app',
    booking: 'Booking.com',
    product: 'Product',
  }[ch] || ch || 'Link')

export default function AmbassadorLinks() {
  const [links, setLinks] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const reload = useCallback(() => {
    api('/api/ambassadors/me/links')
      .then((d) => setLinks(d.links || []))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const copy = async (url, id) => {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(''), 1500)
  }

  const core = links.filter((l) => l.channel !== 'product')
  const products = links.filter((l) => l.channel === 'product')

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">My links &amp; QR codes</h1>
      <p className="mb-6 text-sm text-gray-500">
        Paste these into TikTok, Instagram, or texts. Every tap is tracked to you.
      </p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Core links</h2>
      <div className="mb-8 grid gap-4">
        {core.map((l) => (
          <div key={l.id} className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-start">
            <LinkQr url={l.url} name={l.code} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-900">{channelLabel(l.channel)}</div>
              <div className="mt-1 break-all font-mono text-xs text-gray-600">{l.url}</div>
              <div className="mt-2 text-xs text-gray-500">{l.clicks} clicks</div>
              <button
                type="button"
                onClick={() => copy(l.url, l.id)}
                className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                {copied === l.id ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        ))}
        {!core.length && !error && <div className="text-gray-500">Loading…</div>}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Product links</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((l) => (
          <div key={l.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              {l.product?.imageUrl && (
                <img src={l.product.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">{l.product?.name || l.code}</div>
                <div className="mt-1 break-all font-mono text-xs text-gray-500">{l.url}</div>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => copy(l.url, l.id)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    {copied === l.id ? 'Copied!' : 'Copy'}
                  </button>
                  <span className="text-xs text-gray-400">{l.clicks} clicks</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <LinkQr url={l.url} name={l.code} />
            </div>
          </div>
        ))}
        {!products.length && (
          <div className="text-sm text-gray-400">No product links yet — catalog may be empty.</div>
        )}
      </div>
    </div>
  )
}
