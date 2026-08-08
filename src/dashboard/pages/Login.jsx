import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { hasRole } from '../roles'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const homeFor = (u) => {
    if (u?.mustChangePassword) return '/choose-password'
    if (hasRole(u, 'super_admin', 'account_manager')) return '/'
    if (hasRole(u, 'teacher')) return '/education/my-courses'
    if (hasRole(u, 'ambassador')) return '/ambassador'
    return '/'
  }

  if (user) return <Navigate to={homeFor(user)} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u = await login(email, password)
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
        <h1 className="text-xl font-bold text-gray-900">WBS Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to manage your voice businesses.</p>
        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <label className="mt-5 block text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <div className="mt-2 text-right">
          <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
