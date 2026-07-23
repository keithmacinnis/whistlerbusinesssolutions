import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'

export default function EducationStudents() {
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    api('/api/education/teacher/students')
      .then(({ sessions: s }) => setSessions(s))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My students</h1>
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!sessions && !error && <div className="text-gray-500">Loading…</div>}

      {sessions?.map((s) => (
        <div key={s.id} className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="font-semibold text-gray-900">{s.title}</div>
            <div className="text-xs text-gray-500">
              {new Date(s.startAt).toLocaleString()} · {s.status}
              {s.meetingUrl && (
                <>
                  {' · '}
                  <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                    Meeting link
                  </a>
                </>
              )}
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {s.enrollments.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">{e.name}</td>
                  <td className="px-4 py-2">
                    <a href={`mailto:${e.email}`} className="text-brand-600 hover:underline">{e.email}</a>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!s.enrollments.length && (
                <tr><td colSpan={3} className="px-4 py-4 text-gray-400">No confirmed students yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      {sessions && !sessions.length && <div className="text-gray-400">No sessions yet</div>}
    </div>
  )
}
