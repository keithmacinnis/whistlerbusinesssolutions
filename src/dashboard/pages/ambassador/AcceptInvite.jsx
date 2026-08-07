import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth'

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    api(`/api/ambassadors/invites/${token}`)
      .then((d) => setEmail(d.email))
      .catch((err) => setError(err.message))
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api(`/api/ambassadors/invites/${token}/accept`, {
        method: 'POST',
        body: { password, name },
      })
      await login(email, password)
      navigate('/ambassador', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <div className="p-8 text-red-600">Missing invite token</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Join the family seller program</h1>
        <p className="mt-1 text-sm text-gray-500">Set a password for {email || 'your account'}.</p>
        {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <label className="mt-4 block text-sm text-gray-700">
          Name
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm text-gray-700">
          Password
          <input
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Activate account'}
        </button>
      </form>
    </div>
  )
}
