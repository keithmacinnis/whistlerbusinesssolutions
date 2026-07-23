import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'

export default function EducationAvailability() {
  const [slots, setSlots] = useState(null)
  const [templates, setTemplates] = useState([])
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState('')
  const [slotForm, setSlotForm] = useState(null)
  const [publishForm, setPublishForm] = useState(null)

  const reload = useCallback(() => {
    setError('')
    Promise.all([
      api('/api/education/teacher/availability'),
      api('/api/education/teacher/templates'),
      api('/api/education/teacher/sessions'),
    ])
      .then(([{ slots: s }, { templates: t }, { sessions: sess }]) => {
        setSlots(s)
        setTemplates(t)
        setSessions(sess)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])

  const addSlot = async () => {
    try {
      await api('/api/education/teacher/availability', {
        method: 'POST',
        body: {
          startAt: new Date(slotForm.startAt).toISOString(),
          endAt: new Date(slotForm.endAt).toISOString(),
          templateId: slotForm.templateId || null,
          note: slotForm.note || null,
        },
      })
      setSlotForm(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeSlot = async (id) => {
    try {
      await api(`/api/education/teacher/availability/${id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const publish = async () => {
    try {
      await api('/api/education/teacher/sessions', {
        method: 'POST',
        body: {
          templateId: publishForm.templateId,
          availabilityId: publishForm.availabilityId || undefined,
          startAt: publishForm.startAt ? new Date(publishForm.startAt).toISOString() : undefined,
          endAt: publishForm.endAt ? new Date(publishForm.endAt).toISOString() : undefined,
          meetingUrl: publishForm.meetingUrl,
          seatCap: publishForm.seatCap ? Number(publishForm.seatCap) : undefined,
          priceCents: publishForm.priceDollars != null ? Math.round(Number(publishForm.priceDollars) * 100) : undefined,
          status: 'published',
        },
      })
      setPublishForm(null)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const complete = async (id) => {
    try {
      await api(`/api/education/teacher/sessions/${id}`, { method: 'PATCH', body: { status: 'completed' } })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Availability & sessions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSlotForm({ startAt: '', endAt: '', templateId: '', note: '' })}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
          >
            + Availability
          </button>
          <button
            onClick={() =>
              setPublishForm({
                templateId: templates[0]?.id || '',
                availabilityId: '',
                meetingUrl: '',
                seatCap: templates[0]?.defaultSeatCap || 10,
                priceDollars: templates[0] ? (templates[0].defaultPriceCents / 100).toFixed(2) : '99',
              })
            }
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            + Publish session
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Availability</h2>
      <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(slots || []).map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">{new Date(s.startAt).toLocaleString()}</td>
                <td className="px-4 py-3">{new Date(s.endAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{s.template?.title || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeSlot(s.id)} className="text-red-600 hover:underline">Remove</button>
                </td>
              </tr>
            ))}
            {slots && !slots.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No availability slots</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">My published sessions</h2>
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                <td className="px-4 py-3">{new Date(s.startAt).toLocaleString()}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3 text-right">
                  {s.status !== 'completed' && s.status !== 'cancelled' && (
                    <button onClick={() => complete(s.id)} className="text-brand-600 hover:underline">Complete</button>
                  )}
                </td>
              </tr>
            ))}
            {!sessions.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No sessions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {slotForm && (
        <Modal title="Add availability" onClose={() => setSlotForm(null)}>
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-gray-600">Start</span>
              <input type="datetime-local" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={slotForm.startAt} onChange={(e) => setSlotForm({ ...slotForm, startAt: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-gray-600">End</span>
              <input type="datetime-local" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={slotForm.endAt} onChange={(e) => setSlotForm({ ...slotForm, endAt: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-gray-600">Linked course (optional)</span>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={slotForm.templateId} onChange={(e) => setSlotForm({ ...slotForm, templateId: e.target.value })}>
                <option value="">—</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSlotForm(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={addSlot} className="rounded-md bg-brand-600 px-4 py-2 text-white">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {publishForm && (
        <Modal title="Publish session" onClose={() => setPublishForm(null)}>
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-gray-600">Course</span>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={publishForm.templateId} onChange={(e) => setPublishForm({ ...publishForm, templateId: e.target.value })}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-gray-600">From availability (optional)</span>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={publishForm.availabilityId} onChange={(e) => setPublishForm({ ...publishForm, availabilityId: e.target.value })}>
                <option value="">Pick times manually…</option>
                {(slots || []).map((s) => (
                  <option key={s.id} value={s.id}>{new Date(s.startAt).toLocaleString()}</option>
                ))}
              </select>
            </label>
            {!publishForm.availabilityId && (
              <>
                <label className="block">
                  <span className="text-gray-600">Start</span>
                  <input type="datetime-local" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={publishForm.startAt || ''} onChange={(e) => setPublishForm({ ...publishForm, startAt: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-gray-600">End</span>
                  <input type="datetime-local" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={publishForm.endAt || ''} onChange={(e) => setPublishForm({ ...publishForm, endAt: e.target.value })} />
                </label>
              </>
            )}
            <label className="block">
              <span className="text-gray-600">Zoom / Google Meet link</span>
              <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={publishForm.meetingUrl} onChange={(e) => setPublishForm({ ...publishForm, meetingUrl: e.target.value })} placeholder="https://zoom.us/j/…" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-gray-600">Seats</span>
                <input type="number" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={publishForm.seatCap} onChange={(e) => setPublishForm({ ...publishForm, seatCap: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-gray-600">Price $</span>
                <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" value={publishForm.priceDollars} onChange={(e) => setPublishForm({ ...publishForm, priceDollars: e.target.value })} />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPublishForm(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={publish} className="rounded-md bg-brand-600 px-4 py-2 text-white">Publish</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
