import { useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'

function CreateSeriesModal({ open, onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', closingLine: '', description: '' })

  if (!open) return null

  const create = async () => {
    setError('')
    setSaving(true)
    try {
      const { series: created } = await api('/api/marketing/creative/series', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          closingLine: form.closingLine.trim() || undefined,
          description: form.description.trim() || undefined,
        },
      })
      onCreated?.(created)
      onClose?.()
      setForm({ name: '', closingLine: '', description: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Create a series" onClose={() => !saving && onClose?.()}>
      <p className="mb-4 text-sm text-gray-500">
        A series is a named collection of ideas — e.g. a seasonal story pack or a product push.
      </p>
      {error && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Name *
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Spring Presence"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            autoFocus
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Closing line
          <input
            value={form.closingLine}
            onChange={(e) => setForm({ ...form, closingLine: e.target.value })}
            placeholder="Optional tagline for the collection"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={create}
          disabled={!form.name.trim() || saving}
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create series'}
        </button>
      </div>
    </Modal>
  )
}

/** Compact + control for filter bars / chip rows. */
export function CreateSeriesPlus({ onCreated, className = '' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Create a new series"
        className={
          className ||
          'rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
        }
      >
        +
      </button>
      <CreateSeriesModal open={open} onClose={() => setOpen(false)} onCreated={onCreated} />
    </>
  )
}

/**
 * Series <select> with a + control to create a new series inline.
 * value/onChange use series slug string ('' = ungrouped).
 */
export default function SeriesSelect({
  series = [],
  value,
  onChange,
  onSeriesCreated,
  allowUngrouped = true,
  label = 'Series',
}) {
  const [creating, setCreating] = useState(false)

  return (
    <>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        <div className="mt-1 flex gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {series.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
            {allowUngrouped && <option value="">Ungrouped</option>}
          </select>
          <button
            type="button"
            onClick={() => setCreating(true)}
            title="Create a new series"
            className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-lg font-semibold leading-none text-gray-700 hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </label>

      <CreateSeriesModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(created) => {
          onSeriesCreated?.(created)
          onChange(created.slug)
        }}
      />
    </>
  )
}
