import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-xl font-bold text-gray-900">Forgot password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll send a reset link if an account exists.
        </p>
        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {done ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              If that email is registered, we sent a reset link. Check your inbox (and spam).
            </div>
            <Link to="/login" className="block text-center text-sm font-medium text-brand-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
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
            <button
              type="submit"
              disabled={busy}
              className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            <Link
              to="/login"
              className="mt-4 block text-center text-sm text-gray-500 hover:text-brand-600"
            >
              Back to sign in
            </Link>
          </>
        )}
      </form>
    </div>
  )
}
