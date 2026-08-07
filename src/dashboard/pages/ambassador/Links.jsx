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

function LinkCard({ link, copied, onCopy }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-start">
      <LinkQr url={link.url} name={link.code} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900">{link.label || link.channel}</div>
        {link.destinationUrl && (
          <div className="mt-0.5 truncate text-xs text-gray-500" title={link.destinationUrl}>
            → {link.destinationUrl.replace(/^https?:\/\/(www\.)?/, '')}
          </div>
        )}
        <div className="mt-1 break-all font-mono text-xs text-gray-600">{link.url}</div>
        <div className="mt-2 text-xs text-gray-500">{link.clicks} clicks</div>
        <button
          type="button"
          onClick={() => onCopy(link.url, link.id)}
          className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          {copied === link.id ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}

export default function AmbassadorLinks() {
  const [links, setLinks] = useState([])
  const [destinations, setDestinations] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const reload = useCallback(() => {
    api('/api/ambassadors/me/links')
      .then((d) => {
        setLinks(d.links || [])
        setDestinations(d.bookingDestinations || [])
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const copy = async (url, id) => {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(''), 1500)
  }

  const addBooking = async ({ slug, pageUrl }) => {
    setError('')
    setAdding(true)
    try {
      await api('/api/ambassadors/me/links/booking', {
        method: 'POST',
        body: slug ? { slug } : { pageUrl },
      })
      setCustomUrl('')
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const birdnest = links.filter((l) => l.channel === 'birdnest' || l.channel === 'birdnest_appstore')
  const booking = links.filter((l) => l.channel === 'booking')
  const shop = links.filter((l) => l.channel === 'shop')
  const products = links.filter((l) => l.channel === 'product')

  const existingBookingDests = new Set(
    booking
      .map((l) => l.destinationUrl)
      .filter(Boolean)
      .map((u) => u.replace(/\/$/, ''))
  )
  const unusedPresets = destinations.filter((d) => !existingBookingDests.has(d.pageUrl.replace(/\/$/, '')))

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">My links &amp; QR codes</h1>
      <p className="mb-6 text-sm text-gray-500">
        Paste these into TikTok, Instagram, or texts. Every tap is tracked to you.
      </p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Shop</h2>
      <div className="mb-8 grid gap-4">
        {shop.map((l) => (
          <LinkCard key={l.id} link={l} copied={copied} onCopy={copy} />
        ))}
      </div>

      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">BirdNest app</h2>
      <p className="mb-3 text-xs text-gray-500">
        Use the get page when you want commission tracking (sets a cookie before install). App Store is a direct install link —
        great for ads; commissions need the get page or in-app claim.
      </p>
      <div className="mb-8 grid gap-4">
        {birdnest.map((l) => (
          <LinkCard key={l.id} link={l} copied={copied} onCopy={copy} />
        ))}
        {!birdnest.length && !error && <div className="text-gray-500">Loading…</div>}
      </div>

      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">Booking.com</h2>
      <p className="mb-3 text-xs text-gray-500">
        Default is Whistler. Add more cities for trip posts — each gets its own trackable link + QR.
      </p>
      <div className="mb-4 grid gap-4">
        {booking.map((l) => (
          <LinkCard key={l.id} link={l} copied={copied} onCopy={copy} />
        ))}
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 text-sm font-medium text-gray-900">Add a destination</div>
        {unusedPresets.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {unusedPresets.map((d) => (
              <button
                key={d.slug}
                type="button"
                disabled={adding}
                onClick={() => addBooking({ slug: d.slug })}
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50"
              >
                + {d.label}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault()
            if (customUrl.trim()) addBooking({ pageUrl: customUrl.trim() })
          }}
        >
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Or paste any booking.com city / hotel URL"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={adding || !customUrl.trim()}
            className="rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add link'}
          </button>
        </form>
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
                <div className="text-sm font-semibold text-gray-900">{l.product?.name || l.label || l.code}</div>
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
