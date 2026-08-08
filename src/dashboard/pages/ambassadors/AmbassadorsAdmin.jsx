import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { useViewAsAmbassador } from '../../viewAsAmbassador'

export default function AmbassadorsAdmin() {
  const [list, setList] = useState([])
  const [error, setError] = useState('')
  const [invite, setInvite] = useState(null)
  const [created, setCreated] = useState(null)
  const { startViewAs } = useViewAsAmbassador()
  const navigate = useNavigate()

  const reload = useCallback(() => {
    api('/api/ambassadors')
      .then((d) => setList(d.ambassadors || []))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const submitInvite = async () => {
    setError('')
    try {
      const res = await api('/api/ambassadors', {
        method: 'POST',
        body: {
          email: invite.email,
          name: invite.name,
          displayName: invite.displayName || invite.name,
          code: invite.code,
          status: 'approved',
          password: invite.password || undefined,
        },
      })
      setCreated(res)
      setInvite(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const setStatus = async (id, status) => {
    try {
      await api(`/api/ambassadors/${id}`, { method: 'PATCH', body: { status } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const viewAs = (a) => {
    startViewAs(a)
    navigate('/ambassador')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ambassadors</h1>
          <p className="text-sm text-gray-500">Invite family sellers, set rates, view-as their hub.</p>
        </div>
        <button
          type="button"
          onClick={() => setInvite({ email: '', name: '', displayName: '', code: '', password: '' })}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          Invite
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {created && (
        <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-900">
          <div className="font-semibold">
            {created.existingUser ? 'Ambassador role added for' : 'Invite created for'}{' '}
            {created.ambassador?.user?.email}
          </div>
          <div className="mt-1 break-all">Invite URL: {created.inviteUrl}</div>
          {created.temporaryPassword && (
            <div className="mt-1">Temp password: <code>{created.temporaryPassword}</code></div>
          )}
          {created.existingUser && (
            <div className="mt-1 text-green-800">Existing account kept its password; ambassador access was added.</div>
          )}
          <button type="button" className="mt-2 text-xs underline" onClick={() => setCreated(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Rates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{a.displayName || a.user?.name || '—'}</div>
                  <div className="text-xs text-gray-500">{a.user?.email}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  BN {a.birdnestSharePct}% · Net {a.networkSharePct}% · Own {a.ownStoreSharePct}%
                </td>
                <td className="px-4 py-3">{a.status}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button type="button" onClick={() => viewAs(a)} className="text-xs font-medium text-brand-600">
                    View as
                  </button>
                  {a.status !== 'approved' && (
                    <button type="button" onClick={() => setStatus(a.id, 'approved')} className="text-xs text-gray-600">
                      Approve
                    </button>
                  )}
                  {a.status !== 'suspended' && (
                    <button type="button" onClick={() => setStatus(a.id, 'suspended')} className="text-xs text-red-600">
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No ambassadors yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {invite && (
        <Modal title="Invite ambassador" onClose={() => setInvite(null)}>
          <div className="space-y-3">
            {['email', 'name', 'displayName', 'code', 'password'].map((k) => (
              <label key={k} className="block text-sm text-gray-700">
                {k === 'password'
                  ? 'Password (optional — random if blank; ignored for existing users)'
                  : k}
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  type={k === 'password' ? 'password' : 'text'}
                  value={invite[k]}
                  onChange={(e) => setInvite({ ...invite, [k]: e.target.value })}
                  required={k === 'email'}
                />
              </label>
            ))}
            <p className="text-xs text-gray-500">
              If the email already belongs to a teacher (or other user), ambassador is added as an extra role.
            </p>
            <button
              type="button"
              onClick={submitInvite}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
            >
              Create
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
