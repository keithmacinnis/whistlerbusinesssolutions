import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { hasRole } from '../roles'

const ROLE_TABS = [
  { value: 'ambassador', label: 'Ambassador' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'account_manager', label: 'Account manager' },
  { value: 'super_admin', label: 'Super admin' },
]

const EMPTY = {
  role: '',
  subject: '',
  bodyText: '',
  bodyHtml: '',
  enabled: true,
}

export default function OnboardingEmails() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState(null)
  const [placeholders, setPlaceholders] = useState([])
  const [active, setActive] = useState('ambassador')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = useCallback(() => {
    api('/api/auth/onboarding-emails')
      .then((data) => {
        setTemplates(data.templates || [])
        setPlaceholders(data.placeholders || [])
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  useEffect(() => {
    if (!templates) return
    const t = templates.find((row) => row.role === active)
    if (!t) {
      setForm({ ...EMPTY, role: active })
      return
    }
    setForm({
      role: t.role,
      subject: t.subject || '',
      bodyText: t.bodyText || '',
      bodyHtml: t.bodyHtml || '',
      enabled: t.enabled !== false,
    })
    setNote('')
  }, [templates, active])

  const save = async () => {
    setError('')
    setNote('')
    setSaving(true)
    try {
      await api(`/api/auth/onboarding-emails/${active}`, {
        method: 'PUT',
        body: {
          subject: form.subject,
          bodyText: form.bodyText,
          bodyHtml: form.bodyHtml.trim() || null,
          enabled: form.enabled,
        },
      })
      setNote('Saved')
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!hasRole(user, 'super_admin')) {
    return <div className="text-gray-500">Onboarding emails are limited to super admins.</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding emails</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sent automatically when a role is newly granted. You can also resend from Users.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              active === tab.value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {note && <div className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-800">{note}</div>}
      {!templates && !error && <div className="text-gray-500">Loading…</div>}

      {templates && (
        <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Enabled — send when this role is newly granted
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Subject
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Body (plain text)
            <textarea
              value={form.bodyText}
              onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
              rows={12}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Body HTML <span className="font-normal text-gray-400">(optional — plain text used if blank)</span>
            <textarea
              value={form.bodyHtml}
              onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
              rows={8}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>

          <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Placeholders:{' '}
            {(placeholders.length
              ? placeholders
              : ['name', 'email', 'role', 'dashboardUrl', 'tempPassword']
            )
              .map((p) => `{{${p}}}`)
              .join(' · ')}
            . Empty tempPassword is omitted when the account already exists.
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || !form.subject.trim() || !form.bodyText.trim()}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save template'}
          </button>
        </div>
      )}
    </div>
  )
}
