import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'

export default function SettingsTab({ business, reload }) {
  const navigate = useNavigate()
  const [name, setName] = useState(business.name)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const patch = async (data, okMessage) => {
    setError('')
    setMessage('')
    try {
      await api(`/api/voice/businesses/${business.id}`, { method: 'PATCH', body: data })
      setMessage(okMessage)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const archive = async () => {
    if (!window.confirm(`Archive "${business.name}"? Its number stops being managed and it disappears from the list.`)) return
    try {
      await api(`/api/voice/businesses/${business.id}`, { method: 'DELETE' })
      navigate('/businesses')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {message && <div className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Business name</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={() => patch({ name }, 'Name updated')}
            disabled={!name.trim() || name === business.name}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Status</h2>
        <p className="mt-1 text-sm text-gray-500">
          Pausing keeps everything configured but marks the line as not taking calls.
        </p>
        <div className="mt-3 flex gap-2">
          {business.status !== 'live' && (
            <button
              onClick={() => patch({ status: 'live' }, 'Business is live')}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Set live
            </button>
          )}
          {business.status !== 'paused' && (
            <button
              onClick={() => patch({ status: 'paused' }, 'Business paused')}
              className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
            >
              Pause
            </button>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-800">Danger zone</h2>
        <p className="mt-1 text-sm text-red-600">
          Archiving hides this business from the dashboard. Call history is kept.
        </p>
        <button
          onClick={archive}
          className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Archive business
        </button>
      </section>
    </div>
  )
}
