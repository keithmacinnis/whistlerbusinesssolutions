import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'

const EMPTY = {
  title: '',
  description: '',
  defaultSeatCap: 10,
  defaultPriceCents: 9900,
  durationMinutes: 60,
  materials: [],
}

const dollars = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

export default function MyCourses() {
  const [templates, setTemplates] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)

  const reload = useCallback(() => {
    api('/api/education/teacher/templates')
      .then(({ templates: t }) => setTemplates(t))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const save = async () => {
    setError('')
    try {
      const body = {
        ...form,
        defaultSeatCap: Number(form.defaultSeatCap),
        defaultPriceCents: Math.round(Number(form.priceDollars) * 100),
        durationMinutes: Number(form.durationMinutes),
        materials: form.materialsText
          ? form.materialsText
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => {
                const [title, url] = line.split('|').map((s) => s.trim())
                return { title: title || line, url: url || '' }
              })
          : [],
      }
      delete body.priceDollars
      delete body.materialsText
      if (form.id) {
        await api(`/api/education/teacher/templates/${form.id}`, { method: 'PATCH', body })
      } else {
        await api('/api/education/teacher/templates', { method: 'POST', body })
      }
      setForm(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My courses</h1>
        <button
          onClick={() => setForm({ ...EMPTY, priceDollars: '99', materialsText: '' })}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New course
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!templates && !error && <div className="text-gray-500">Loading…</div>}

      {templates && (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs ${t.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {t.active ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">{t.description || 'No description'}</p>
              <div className="mt-3 text-sm text-gray-500">
                {dollars(t.defaultPriceCents)} · {t.defaultSeatCap} seats · {t.durationMinutes} min
              </div>
              <button
                className="mt-3 text-sm text-brand-600 hover:underline"
                onClick={() =>
                  setForm({
                    ...t,
                    priceDollars: (t.defaultPriceCents / 100).toFixed(2),
                    materialsText: (t.materials || []).map((m) => `${m.title}|${m.url || ''}`).join('\n'),
                  })
                }
              >
                Edit
              </button>
            </div>
          ))}
          {!templates.length && <div className="text-gray-400">No course templates yet</div>}
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Edit course' : 'New course'} onClose={() => setForm(null)}>
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-gray-600">Title</span>
              <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-gray-600">Description</span>
              <textarea className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-gray-600">Price $</span>
                <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.priceDollars} onChange={(e) => setForm({ ...form, priceDollars: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-gray-600">Seats</span>
                <input type="number" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.defaultSeatCap} onChange={(e) => setForm({ ...form, defaultSeatCap: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-gray-600">Minutes</span>
                <input type="number" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
              </label>
            </div>
            <label className="block">
              <span className="text-gray-600">Materials (one per line: Title|URL)</span>
              <textarea className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" rows={3} value={form.materialsText || ''} onChange={(e) => setForm({ ...form, materialsText: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setForm(null)} className="rounded-md px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={save} className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
