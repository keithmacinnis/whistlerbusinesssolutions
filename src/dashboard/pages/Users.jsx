import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import { useAuth } from '../auth'
import { hasRole, userRoles } from '../roles'

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super admin' },
  { value: 'account_manager', label: 'Account manager' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'ambassador', label: 'Ambassador' },
]

const ROLE_PILL = {
  super_admin: 'bg-violet-100 text-violet-800',
  account_manager: 'bg-sky-100 text-sky-800',
  teacher: 'bg-emerald-100 text-emerald-800',
  ambassador: 'bg-amber-100 text-amber-900',
}

const EMPTY = { email: '', name: '', password: '', roles: ['account_manager'], businessIds: [] }

function RolePills({ roles }) {
  const list = roles?.length ? roles : []
  if (!list.length) return <span className="text-xs text-gray-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((r) => (
        <span
          key={r}
          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            ROLE_PILL[r] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {r.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  )
}

function RoleEditor({ roles, onChange, disableSuperAdminRemove }) {
  const toggle = (value, checked) => {
    if (!checked && value === 'super_admin' && disableSuperAdminRemove) return
    if (checked) onChange([...new Set([...roles, value])])
    else {
      const next = roles.filter((r) => r !== value)
      if (next.length === 0) return
      onChange(next)
    }
  }

  return (
    <fieldset className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <legend className="px-1 text-sm font-semibold text-gray-800">Roles</legend>
      <p className="mb-2 text-xs text-gray-500">
        Check to add, uncheck to remove. Teacher/ambassador profiles are created or suspended automatically.
      </p>
      <div className="space-y-2">
        {ROLE_OPTIONS.map((opt) => {
          const checked = roles.includes(opt.value)
          const locked = opt.value === 'super_admin' && checked && disableSuperAdminRemove
          return (
            <label
              key={opt.value}
              className={`flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm ring-1 ring-gray-200 ${
                locked ? 'opacity-70' : ''
              }`}
            >
              <span className="flex items-center gap-2 text-gray-800">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  onChange={(e) => toggle(opt.value, e.target.checked)}
                />
                {opt.label}
              </span>
              {checked && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    ROLE_PILL[opt.value] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  on
                </span>
              )}
            </label>
          )
        })}
      </div>
      {roles.length === 0 && (
        <p className="mt-2 text-xs text-red-600">At least one role is required.</p>
      )}
    </fieldset>
  )
}

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sendingRole, setSendingRole] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [note, setNote] = useState('')

  const reload = useCallback(() => {
    api('/api/auth/users')
      .then(({ users: list }) => setUsers(list))
      .catch((err) => setError(err.message))
    api('/api/voice/businesses')
      .then(({ businesses: list }) => setBusinesses(list))
      .catch(() => {})
  }, [])

  useEffect(reload, [reload])

  const create = async () => {
    setError('')
    setSaving(true)
    try {
      await api('/api/auth/users', { method: 'POST', body: form })
      setCreating(false)
      setForm(EMPTY)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    setError('')
    if (!editing.roles.length) {
      setError('At least one role is required')
      return
    }
    setSaving(true)
    try {
      await api(`/api/auth/users/${editing.id}`, {
        method: 'PATCH',
        body: {
          name: editing.name,
          roles: editing.roles,
          ...(editing.password ? { password: editing.password } : {}),
        },
      })
      setEditing(null)
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
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

  const openEdit = (u) => {
    setError('')
    setNote('')
    setEditing({
      id: u.id,
      email: u.email,
      name: u.name || '',
      roles: userRoles(u),
      password: '',
    })
  }

  const sendOnboarding = async (userId, role) => {
    setError('')
    setNote('')
    const label = role ? role.replace(/_/g, ' ') : 'all roles'
    if (!confirm(`Send onboarding email (${label}) to this user?`)) return
    setSendingRole(role || 'all')
    try {
      const res = await api(`/api/auth/users/${userId}/send-onboarding`, {
        method: 'POST',
        body: role ? { role } : {},
      })
      const sent = (res.results || []).filter((r) => r.sent).map((r) => r.role)
      const skipped = (res.results || []).filter((r) => !r.sent)
      if (sent.length) setNote(`Sent: ${sent.join(', ')}`)
      else if (skipped.length) {
        setError(
          `Not sent (${skipped.map((r) => `${r.role}: ${r.reason || 'failed'}`).join('; ')})`
        )
      } else setError('No emails sent')
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingRole('')
    }
  }

  if (!hasRole(me, 'super_admin')) {
    return <div className="text-gray-500">User management is limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add or remove roles for any account. Someone can be both teacher and ambassador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY)
            setCreating(true)
          }}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add user
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {note && <div className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-800">{note}</div>}
      {!users && !error && <div className="text-gray-500">Loading…</div>}

      {users && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Since</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{u.name || u.email}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <RolePills roles={userRoles(u)} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(u)}
                      disabled={u.id === me?.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        u.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      } disabled:cursor-not-allowed`}
                    >
                      {u.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                    >
                      Edit roles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="Add user" onClose={() => setCreating(false)}>
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
            <RoleEditor
              roles={form.roles}
              onChange={(roles) => setForm({ ...form, roles })}
            />
            {form.roles.includes('account_manager') && businesses.length > 0 && (
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
              type="button"
              onClick={create}
              disabled={!form.email.trim() || form.password.length < 8 || form.roles.length === 0 || saving}
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit roles" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-900">{editing.name || editing.email}</div>
              <div className="text-xs text-gray-500">{editing.email}</div>
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Name
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <RoleEditor
              roles={editing.roles}
              onChange={(roles) => setEditing({ ...editing, roles })}
              disableSuperAdminRemove={editing.id === me?.id}
            />
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-sm font-semibold text-gray-800">Send onboarding</div>
              <p className="mt-0.5 text-xs text-gray-500">
                Resend the welcome email for roles this user already has (does not require saving).
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {editing.roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={!!sendingRole}
                    onClick={() => sendOnboarding(editing.id, role)}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {sendingRole === role ? 'Sending…' : role.replace(/_/g, ' ')}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={!!sendingRole || !editing.roles.length}
                  onClick={() => sendOnboarding(editing.id)}
                  className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {sendingRole === 'all' ? 'Sending…' : 'Send all'}
                </button>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700">
              New password <span className="font-normal text-gray-400">(optional)</span>
              <input
                type="password"
                value={editing.password}
                onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={saveEdit}
              disabled={
                editing.roles.length === 0 ||
                (editing.password && editing.password.length < 8) ||
                saving
              }
              className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save roles'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
