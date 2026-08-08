import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { hasRole } from '../roles'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!token) {
      setError('Missing reset token')
      setChecking(false)
      return
    }
    api(`/api/auth/reset-password/${token}`)
      .then((d) => setEmail(d.email))
      .catch((err) => setError(err.message))
      .finally(() => setChecking(false))
  }, [token])

  const homeFor = (u) => {
    if (hasRole(u, 'super_admin', 'account_manager')) return '/'
    if (hasRole(u, 'teacher')) return '/education/my-courses'
    if (hasRole(u, 'ambassador')) return '/ambassador'
    return '/'
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      const { email: loginEmail } = await api('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      })
      const u = await login(loginEmail || email, password)
      navigate(homeFor(u), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-xl font-bold text-gray-900">Set a new password</h1>
        <p className="mt-1 text-sm text-gray-500">
          {email ? `For ${email}` : 'Choose a password for your dashboard account.'}
        </p>
        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {checking ? (
          <p className="mt-5 text-sm text-gray-500">Checking link…</p>
        ) : error && !email ? (
          <Link to="/forgot-password" className="mt-5 block text-center text-sm font-medium text-brand-600 hover:underline">
            Request a new reset link
          </Link>
        ) : (
          <>
            <label className="mt-5 block text-sm font-medium text-gray-700">
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
            <label className="mt-4 block text-sm font-medium text-gray-700">
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
              disabled={busy || !token}
              className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save password & sign in'}
            </button>
          </>
        )}
        <Link to="/login" className="mt-4 block text-center text-sm text-gray-500 hover:text-brand-600">
          Back to sign in
        </Link>
      </form>
    </div>
  )
}
