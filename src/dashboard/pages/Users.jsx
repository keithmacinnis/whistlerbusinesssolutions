import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import { useAuth } from '../auth'

const EMPTY = { email: '', name: '', password: '', role: 'account_manager', businessIds: [] }

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const reload = useCallback(() => {
    api('/api/auth/users')
      .then(({ users }) => setUsers(users))
      .catch((err) => setError(err.message))
    api('/api/voice/businesses')
      .then(({ businesses }) => setBusinesses(businesses))
      .catch(() => {})
  }, [])

  useEffect(reload, [reload])

  const create = async () => {
    setError('')
    try {
      await api('/api/auth/users', { method: 'POST', body: form })
      setCreating(false)
      setForm(EMPTY)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleActive = async (u) => {
    if (u.id === me?.id) return
    try {
      await api(`/api/auth/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add account manager
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!users && !error && <div className="text-gray-500">Loading…</div>}

      {users && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{u.name || u.email}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.role.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={u.id === me?.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        u.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      } disabled:cursor-not-allowed`}
                    >
                      {u.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="Add account manager" onClose={() => setCreating(false)}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Email *
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Password * (8+ characters)
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Role
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              >
                <option value="account_manager">Account manager</option>
                <option value="super_admin">Super admin</option>
              </select>
            </label>
            {form.role === 'account_manager' && businesses.length > 0 && (
              <fieldset className="text-sm">
                <legend className="font-medium text-gray-700">
                  Assigned businesses <span className="font-normal text-gray-400">(none = all)</span>
                </legend>
                <div className="mt-1 space-y-1">
                  {businesses.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-gray-600">
                      <input
                        type="checkbox"
                        checked={form.businessIds.includes(b.id)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            businessIds: e.target.checked
                              ? [...form.businessIds, b.id]
                              : form.businessIds.filter((id) => id !== b.id),
                          })
                        }
                      />
                      {b.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <button
              onClick={create}
              disabled={!form.email.trim() || form.password.length < 8}
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Create user
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
