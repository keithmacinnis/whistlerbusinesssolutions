import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'

const OUTCOMES = ['', 'info_only', 'product_recommended', 'app_referral', 'abandoned', 'other']

const fmtDuration = (s) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—')

export default function CallLogsTab({ business }) {
  const [calls, setCalls] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [outcome, setOutcome] = useState('')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const pageSize = 25

  const load = useCallback(() => {
    api(`/api/voice/businesses/${business.id}/calls`, { params: { page, pageSize, outcome, q } })
      .then((data) => {
        setCalls(data.calls)
        setTotal(data.total)
      })
      .catch((err) => setError(err.message))
  }, [business.id, page, outcome, q])

  useEffect(load, [load])

  const openDetail = async (call) => {
    try {
      const { call: full } = await api(`/api/voice/calls/${call.id}`)
      setDetail(full)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Search transcript, summary, phone…"
          className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>{o ? o.replace(/_/g, ' ') : 'All outcomes'}</option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500">{total} call{total === 1 ? '' : 's'}</div>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {calls?.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
          No calls yet. Once the line is live, every call lands here with its transcript and outcome.
        </div>
      )}

      {calls?.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Caller</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {calls.map((c) => (
                <tr key={c.id} onClick={() => openDetail(c)} className="cursor-pointer hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{fmtDate(c.startedAt || c.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{c.callerPhone || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDuration(c.durationSeconds)}</td>
                  <td className="px-4 py-3">
                    {c.outcome ? (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {c.outcome.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="max-w-md truncate px-4 py-3 text-gray-500">{c.summary || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-gray-600">Page {page} of {Math.ceil(total / pageSize)}</span>
          <button
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(page + 1)}
            className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Call detail</h2>
              <button onClick={() => setDetail(null)} className="text-2xl leading-none text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Caller</dt><dd className="text-gray-900">{detail.callerPhone || 'Unknown'}</dd>
              <dt className="text-gray-500">Started</dt><dd className="text-gray-900">{fmtDate(detail.startedAt)}</dd>
              <dt className="text-gray-500">Duration</dt><dd className="text-gray-900">{fmtDuration(detail.durationSeconds)}</dd>
              <dt className="text-gray-500">Ended</dt><dd className="text-gray-900">{detail.endedReason || '—'}</dd>
              <dt className="text-gray-500">Outcome</dt><dd className="text-gray-900">{detail.outcome?.replace(/_/g, ' ') || '—'}</dd>
            </dl>
            {detail.summary && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700">Summary</h3>
                <p className="mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-700">{detail.summary}</p>
              </div>
            )}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700">Transcript</h3>
              <pre className="mt-1 max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 font-sans text-sm text-gray-700">
                {detail.transcript || 'No transcript available.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
