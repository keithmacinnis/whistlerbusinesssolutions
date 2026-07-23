import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'

const EMPTY = { email: '', name: '', password: '', bio: '', teacherSharePct: 70, status: 'approved' }

export default function EducationTeachers() {
  const [teachers, setTeachers] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)

  const reload = useCallback(() => {
    api('/api/education/admin/teachers')
      .then(({ teachers: t }) => setTeachers(t))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const invite = async () => {
    setError('')
    try {
      await api('/api/education/admin/teachers', { method: 'POST', body: form })
      setForm(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const setStatus = async (id, status) => {
    try {
      await api(`/api/education/admin/teachers/${id}`, { method: 'PATCH', body: { status } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        <button
          onClick={() => setForm({ ...EMPTY })}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Invite teacher
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!teachers && !error && <div className="text-gray-500">Loading…</div>}

      {teachers && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Share %</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{t.user.name || t.user.email}</div>
                    <div className="text-xs text-gray-400">{t.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.teacherSharePct}%</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      t.status === 'approved' ? 'bg-green-100 text-green-800'
                        : t.status === 'suspended' ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {t.status !== 'approved' && (
                      <button onClick={() => setStatus(t.id, 'approved')} className="text-brand-600 hover:underline">Approve</button>
                    )}
                    {t.status !== 'suspended' && (
                      <button onClick={() => setStatus(t.id, 'suspended')} className="text-red-600 hover:underline">Suspend</button>
                    )}
                    {t.status === 'suspended' && (
                      <button onClick={() => setStatus(t.id, 'pending')} className="text-gray-600 hover:underline">Reset</button>
                    )}
                  </td>
                </tr>
              ))}
              {!teachers.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No teachers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title="Invite teacher" onClose={() => setForm(null)}>
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-gray-600">Email</span>
              <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-gray-600">Name</span>
              <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-gray-600">Temporary password</span>
              <input type="password" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-gray-600">Teacher share %</span>
              <input type="number" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.teacherSharePct} onChange={(e) => setForm({ ...form, teacherSharePct: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="text-gray-600">Initial status</span>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="approved">approved</option>
                <option value="pending">pending</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setForm(null)} className="rounded-md px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={invite} className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white">Invite</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
