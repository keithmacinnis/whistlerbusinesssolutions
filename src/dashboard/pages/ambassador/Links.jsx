import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { api } from '../../api'

function channelBadge(channel) {
  if (channel === 'birdnest_appstore') return 'iOS App Store'
  if (channel === 'birdnest') return 'Get page'
  if (channel === 'birdnest_shop') return 'BirdNest shop'
  if (channel === 'birdnest_product') return 'BirdNest product'
  if (channel === 'shop') return 'Adorn shop'
  if (channel === 'booking') return 'Booking.com'
  if (channel === 'product') return 'Adorn product'
  return channel || 'Link'
}

function LinkQr({ url, name }) {
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
    a.download = `qr-${name || 'link'}.png`
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

function LinkCard({ link, copied, onCopy, children, hint }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          {link.product?.imageUrl && (
            <img
              src={link.product.imageUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-gray-100"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{link.label || link.channel}</h2>
            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {channelBadge(link.channel)}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-xs text-gray-400">{link.clicks} clicks</span>
      </div>
      {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}
      {link.destinationUrl && (
        <p className="mt-2 truncate text-xs text-gray-500" title={link.destinationUrl}>
          → {link.destinationUrl.replace(/^https?:\/\/(www\.)?/, '')}
        </p>
      )}
      <div className="mt-3 break-all rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
        {link.url}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCopy(link.url, link.id)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied === link.id ? 'Copied' : 'Copy link'}
        </button>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Open ↗
        </a>
        {children}
      </div>
      <LinkQr url={link.url} name={link.code} />
    </div>
  )
}

function Section({ title, hint, children, empty }) {
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {hint && <p className="mb-4 text-sm text-gray-500">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
      {empty}
    </section>
  )
}

export default function AmbassadorLinks() {
  const [links, setLinks] = useState([])
  const [destinations, setDestinations] = useState([])
  const [qrRequest, setQrRequest] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [requestingQr, setRequestingQr] = useState(false)

  const reload = useCallback(() => {
    api('/api/ambassadors/me/links')
      .then((d) => {
        setLinks(d.links || [])
        setDestinations(d.bookingDestinations || [])
        setQrRequest(d.qrRequest || null)
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

  const requestQr = async () => {
    setError('')
    setRequestingQr(true)
    try {
      const res = await api('/api/ambassadors/me/qr-request', { method: 'POST', body: {} })
      setQrRequest(res.request)
    } catch (err) {
      setError(err.message)
    } finally {
      setRequestingQr(false)
    }
  }

  const shops = links.filter((l) => l.channel === 'shop' || l.channel === 'birdnest_shop')
  const appStore = links.find((l) => l.channel === 'birdnest_appstore')
  const booking = links.filter((l) => l.channel === 'booking')
  const adornProducts = links.filter((l) => l.channel === 'product')
  const birdnestProducts = links.filter((l) => l.channel === 'birdnest_product')

  const formatPrice = (cents) =>
    cents != null
      ? `$${(Number(cents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null

  const existingBookingDests = new Set(
    booking
      .map((l) => l.destinationUrl)
      .filter(Boolean)
      .map((u) => u.replace(/\/$/, ''))
  )
  const unusedPresets = destinations.filter((d) => !existingBookingDests.has(d.pageUrl.replace(/\/$/, '')))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My links &amp; QR codes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Paste these into TikTok, Instagram, or texts. Every tap is tracked to you.
        </p>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <Section
        title="BirdNest iOS App Store Landing Page"
        hint="Primary install link for TikTok, Instagram, and bios. Opens BirdNest: Baby Tracker on the App Store — installs are attributed to you."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {appStore && (
            <LinkCard
              link={{ ...appStore, label: 'BirdNest iOS App Store Landing Page' }}
              copied={copied}
              onCopy={copy}
              hint="Share this link or download the QR below. Use the same QR for posts and for printed cards."
            >
              {qrRequest?.status === 'pending' ? (
                <span className="rounded-md bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
                  Tracking setup requested
                </span>
              ) : qrRequest?.status === 'fulfilled' ? (
                <span className="rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
                  Install tracking active
                </span>
              ) : (
                <button
                  type="button"
                  disabled={requestingQr}
                  onClick={requestQr}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {requestingQr ? 'Requesting…' : 'Request install tracking'}
                </button>
              )}
            </LinkCard>
          )}
        </div>
        {!appStore && !error && (
          <div className="text-sm text-gray-400">Loading App Store landing page link…</div>
        )}
      </Section>

      <Section
        title="Shops"
        hint="Send people to browse — Adorn jewelry edit, or BirdNest baby clothes. Purchases attribute back to you."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {shops.map((l) => (
            <LinkCard
              key={l.id}
              link={l}
              copied={copied}
              onCopy={copy}
              hint={
                l.channel === 'birdnest_shop'
                  ? 'BirdNest Families merch shop (clothes & more).'
                  : 'The Adorn List editorial shop — jewelry picks.'
              }
            />
          ))}
        </div>
        {!shops.length && !error && <div className="text-sm text-gray-400">Loading shop links…</div>}
      </Section>

      <Section
        title="Booking.com"
        hint="Default is Whistler. Add more cities for trip posts — each gets its own trackable link + QR."
      >
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {booking.map((l) => (
            <LinkCard key={l.id} link={l} copied={copied} onCopy={copy} />
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
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
      </Section>

      <Section
        title="BirdNest shop products"
        hint="Baby clothes from the BirdNest shop — each link opens the shop with your referral attached."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {birdnestProducts.map((l) => (
            <LinkCard
              key={l.id}
              link={{
                ...l,
                label: l.product?.name || l.label || l.code,
              }}
              copied={copied}
              onCopy={copy}
              hint={
                l.product?.priceCents != null
                  ? formatPrice(l.product.priceCents)
                  : undefined
              }
            />
          ))}
        </div>
        {!birdnestProducts.length && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
            No BirdNest shop products yet — catalog may be empty.
          </div>
        )}
      </Section>

      <Section title="Adorn product links" hint="Direct Buy links for Adorn jewelry picks — hard-sell posts.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {adornProducts.map((l) => (
            <LinkCard
              key={l.id}
              link={{ ...l, label: l.product?.name || l.label || l.code }}
              copied={copied}
              onCopy={copy}
              hint={
                l.product?.priceCents != null
                  ? formatPrice(l.product.priceCents)
                  : undefined
              }
            />
          ))}
        </div>
        {!adornProducts.length && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
            No Adorn product links yet — catalog may be empty.
          </div>
        )}
      </Section>
    </div>
  )
}
