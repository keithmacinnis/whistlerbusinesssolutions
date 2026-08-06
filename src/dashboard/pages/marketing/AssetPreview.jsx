import { useEffect, useState } from 'react'
import { api } from '../../api'

export default function AssetPreview({ assetType, id, title, hasFile, hasLink }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || (!hasFile && !hasLink)) return
    let cancelled = false
    const path =
      assetType === 'still'
        ? `/api/marketing/creative/stills/${id}/play-url`
        : `/api/marketing/creative/videos/${id}/play-url`

    api(path)
      .then((result) => {
        if (!cancelled) setUrl(result.url || '')
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [assetType, hasFile, hasLink, id])

  if (!hasFile && !hasLink) return null

  if (error) {
    return <p className="mt-3 text-xs text-red-600">Preview unavailable: {error}</p>
  }

  if (!url) {
    return (
      <div className="mt-3 h-20 animate-pulse rounded-lg bg-gray-100" aria-label="Loading preview" />
    )
  }

  if (assetType === 'still') {
    return (
      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <img
          src={url}
          alt={title || 'Creative still preview'}
          loading="lazy"
          className="max-h-72 w-full object-contain"
          onError={() => setError('This external link cannot be displayed as an image.')}
        />
      </div>
    )
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-black">
      <video
        src={url}
        controls
        preload="metadata"
        playsInline
        className="max-h-80 w-full object-contain"
        onError={() => setError('This external link cannot be played inline.')}
      >
        Your browser does not support video preview.
      </video>
    </div>
  )
}
