import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function EducationSessions() {
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    api('/api/education/admin/sessions')
      .then(({ sessions: s }) => setSessions(s))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const markCompleted = async (id) => {
    try {
      await api(`/api/education/admin/sessions/${id}`, { method: 'PATCH', body: { status: 'completed' } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">All sessions</h1>
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!sessions && !error && <div className="text-gray-500">Loading…</div>}
      {sessions && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.title}</div>
                    <div className="text-xs text-gray-400">{dollars(s.priceCents)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.teacher?.user?.name || s.teacher?.user?.email}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(s.startAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.enrollments?.filter((e) => e.status === 'confirmed').length || 0}/{s.seatCap}
                  </td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3 text-right">
                    {s.status !== 'completed' && s.status !== 'cancelled' && (
                      <button onClick={() => markCompleted(s.id)} className="text-brand-600 hover:underline">
                        Mark completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!sessions.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No sessions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
