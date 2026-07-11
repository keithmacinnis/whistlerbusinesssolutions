import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import StatusPill from '../components/StatusPill'

export default function BusinessList() {
  const [businesses, setBusinesses] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/voice/businesses')
      .then(({ businesses }) => setBusinesses(businesses))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Call Centres</h1>
        <Link
          to="/businesses/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Call Centre
        </Link>
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!businesses && !error && <div className="text-gray-500">Loading…</div>}

      {businesses?.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-600">No call centres yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Create your first line — like a BabyLine for new parents — and configure its
            phone number, catalog, and scripts.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {businesses?.map((b) => (
          <Link
            key={b.id}
            to={`/businesses/${b.id}`}
            className="rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{b.name}</h2>
              <StatusPill status={b.status} />
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-500">
              <div>📞 {b.phoneNumber || 'No number yet'}</div>
              <div>🛍 {b.productCount} product{b.productCount === 1 ? '' : 's'}</div>
              <div>🎙 {b.voiceId ? `${b.voiceId} (${b.voiceProvider})` : 'No voice selected'}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
