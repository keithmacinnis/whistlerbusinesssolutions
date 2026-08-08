import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { hasRole } from '../roles'

export default function ChoosePassword() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null) // null | 'change'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const homeFor = (u) => {
    if (hasRole(u, 'super_admin', 'account_manager')) return '/'
    if (hasRole(u, 'teacher')) return '/education/my-courses'
    if (hasRole(u, 'ambassador')) return '/ambassador'
    return '/'
  }

  if (!user) return <Navigate to="/login" replace />
  if (!user.mustChangePassword) return <Navigate to={homeFor(user)} replace />

  const finish = async (nextUser) => {
    try {
      const { user: full } = await api('/api/auth/me')
      setUser(full)
      navigate(homeFor(full), { replace: true })
    } catch {
      setUser(nextUser)
      navigate(homeFor(nextUser), { replace: true })
    }
  }

  const keepPassword = async () => {
    setError('')
    setBusy(true)
    try {
      const { user: next } = await api('/api/auth/password-choice', {
        method: 'POST',
        body: { action: 'keep' },
      })
      finish(next)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      const { user: next } = await api('/api/auth/password-choice', {
        method: 'POST',
        body: { action: 'change', password },
      })
      finish(next)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-xl font-bold text-gray-900">Choose your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome{user.name ? `, ${user.name}` : ''}. You can keep the temporary password from your
          invite email, or set a new one now.
        </p>
        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {mode !== 'change' ? (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={keepPassword}
              className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Keep my current password'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode('change')
                setError('')
              }}
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              Set a new password
            </button>
          </div>
        ) : (
          <form onSubmit={changePassword} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              New password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Confirm password
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save new password'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode(null)
                setPassword('')
                setConfirm('')
                setError('')
              }}
              className="w-full text-sm text-gray-500 hover:text-brand-600"
            >
              Back
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full text-center text-sm text-gray-400 hover:text-gray-600"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
