import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import StatCard from '../components/StatCard'
import StatusPill from '../components/StatusPill'
import Modal from '../components/Modal'

const dollars = (cents) => {
  const n = (cents || 0) / 100
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

const PRODUCT_LABELS = {
  birdnest: 'BirdNest Families',
  wbs: 'Whistler Business Solutions',
  for_play: 'For Play',
  shared: 'Shared / overhead',
}

const CATEGORY_LABELS = {
  ads: 'Ads & creative',
  ai_voice: 'AI / voice',
  infra: 'Infra',
  app_tools: 'App tools',
  software: 'Software',
  affiliate: 'Affiliate',
  app_subs: 'App subscriptions',
  merch: 'Merch',
  education: 'Education',
  other: 'Other',
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—')

const toDateInput = (d) => {
  if (!d) return ''
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return ''
  return x.toISOString().slice(0, 10)
}

const emptyLog = () => ({
  accountId: '',
  amount: '',
  occurredAt: toDateInput(new Date()),
  note: '',
  markPaid: true,
})

const emptyEdit = (a) => ({
  id: a.id,
  name: a.name,
  vendor: a.vendor || '',
  direction: a.direction,
  category: a.category,
  productLine: a.productLine,
  cadence: a.cadence,
  expectedAmountCents: a.expectedAmountCents != null ? (a.expectedAmountCents / 100).toFixed(2) : '',
  nextDueAt: toDateInput(a.nextDueAt),
  billingUrl: a.billingUrl || '',
  notes: a.notes || '',
  status: a.status,
})

export default function Finance() {
  const [range, setRange] = useState('month')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [logForm, setLogForm] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setError('')
    api('/api/finance/summary', { params: { range } })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [range])

  useEffect(() => {
    load()
  }, [load])

  const costAccounts = useMemo(
    () => (data?.accounts || []).filter((a) => a.direction === 'cost' && a.status !== 'ended'),
    [data]
  )
  const revenueAccounts = useMemo(
    () => (data?.accounts || []).filter((a) => a.direction === 'revenue' && a.status !== 'ended'),
    [data]
  )

  const openLog = (accountId) => {
    setLogForm({ ...emptyLog(), accountId: accountId || costAccounts[0]?.id || '' })
  }

  const submitLog = async () => {
    setSaving(true)
    setError('')
    try {
      const amountCents = Math.round(parseFloat(logForm.amount) * 100)
      await api('/api/finance/entries', {
        method: 'POST',
        body: {
          accountId: logForm.accountId,
          amountCents,
          occurredAt: logForm.occurredAt || undefined,
          note: logForm.note || undefined,
          markPaid: logForm.markPaid,
        },
      })
      setLogForm(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = async () => {
    setSaving(true)
    setError('')
    try {
      await api(`/api/finance/accounts/${editForm.id}`, {
        method: 'PATCH',
        body: {
          name: editForm.name,
          vendor: editForm.vendor || null,
          direction: editForm.direction,
          category: editForm.category,
          productLine: editForm.productLine,
          cadence: editForm.cadence,
          expectedAmountCents: editForm.expectedAmountCents
            ? Math.round(parseFloat(editForm.expectedAmountCents) * 100)
            : null,
          nextDueAt: editForm.nextDueAt || null,
          billingUrl: editForm.billingUrl || null,
          notes: editForm.notes || null,
          status: editForm.status,
        },
      })
      setEditForm(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const profit = data?.totals?.profitCents ?? 0

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visibility into revenue, costs, profit, and late bills — ads first. No exports or payouts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="month">This month</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            type="button"
            onClick={() => openLog()}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Log cost
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="text-gray-500">Loading…</div>}

      {data && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Revenue" value={dollars(data.totals.revenueCents)} />
            <StatCard label="Costs" value={dollars(data.totals.costCents)} />
            <StatCard
              label="Profit"
              value={dollars(profit)}
              hint={profit >= 0 ? 'in the black' : 'in the red'}
            />
            <StatCard label="Ad burn" value={dollars(data.totals.adBurnCents)} hint="Maki, TikTok, etc." />
            <StatCard
              label="Bills"
              value={`${data.totals.overdueCount} overdue`}
              hint={data.totals.dueSoonCount ? `${data.totals.dueSoonCount} due soon` : 'all clear'}
            />
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">By product</h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.byProduct.map((p) => (
              <div key={p.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="text-sm font-medium text-gray-900">{PRODUCT_LABELS[p.id] || p.id}</div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>In {dollars(p.revenueCents)}</span>
                  <span>Out {dollars(p.costCents)}</span>
                </div>
                <div className={`mt-1 text-lg font-semibold ${p.profitCents >= 0 ? 'text-gray-900' : 'text-red-700'}`}>
                  {dollars(p.profitCents)}
                </div>
              </div>
            ))}
          </div>

          <AccountTable
            title="Costs"
            subtitle="Log Maki / TikTok spend here — biggest burn right now"
            accounts={costAccounts}
            preferAds
            onLog={(id) => openLog(id)}
            onEdit={(a) => setEditForm(emptyEdit(a))}
          />

          <AccountTable
            title="Revenue"
            subtitle="Synced from RevenueCat, shops, AWIN / CJ conversions, education"
            accounts={revenueAccounts}
            onEdit={(a) => setEditForm(emptyEdit(a))}
          />

          {data.streams?.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Synced streams (this range)
              </h2>
              <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Stream</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Direction</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.streams.map((s) => (
                      <tr key={s.key} className={s.excludedFromTotal ? 'opacity-60' : ''}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{s.label}</div>
                          {s.note && <div className="text-xs text-gray-400">{s.note}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{PRODUCT_LABELS[s.productLine] || s.productLine}</td>
                        <td className="px-4 py-3 capitalize text-gray-600">{s.direction}</td>
                        <td className="px-4 py-3 text-right font-medium">{dollars(s.amountCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {logForm && (
        <Modal title="Log cost" onClose={() => setLogForm(null)}>
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-gray-600">Account</span>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={logForm.accountId}
                onChange={(e) => setLogForm({ ...logForm, accountId: e.target.value })}
              >
                {costAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.category === 'ads' ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Amount (USD)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={logForm.amount}
                onChange={(e) => setLogForm({ ...logForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Date</span>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={logForm.occurredAt}
                onChange={(e) => setLogForm({ ...logForm, occurredAt: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Note</span>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={logForm.note}
                onChange={(e) => setLogForm({ ...logForm, note: e.target.value })}
                placeholder="e.g. TikTok week of Aug 1"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={logForm.markPaid}
                onChange={(e) => setLogForm({ ...logForm, markPaid: e.target.checked })}
              />
              Mark as paid (updates last paid + next due)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setLogForm(null)} className="rounded-md border px-3 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !logForm.accountId || !logForm.amount}
                onClick={submitLog}
                className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editForm && (
        <Modal title="Edit account" onClose={() => setEditForm(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="text-gray-600">Name</span>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Vendor</span>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.vendor}
                onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Product</span>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.productLine}
                onChange={(e) => setEditForm({ ...editForm, productLine: e.target.value })}
              >
                {Object.entries(PRODUCT_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Category</span>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Cadence</span>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.cadence}
                onChange={(e) => setEditForm({ ...editForm, cadence: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="usage">Usage</option>
                <option value="one_time">One-time</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Expected amount (USD)</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.expectedAmountCents}
                onChange={(e) => setEditForm({ ...editForm, expectedAmountCents: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Next due</span>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.nextDueAt}
                onChange={(e) => setEditForm({ ...editForm, nextDueAt: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Status</span>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-gray-600">Billing URL</span>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.billingUrl}
                onChange={(e) => setEditForm({ ...editForm, billingUrl: e.target.value })}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-gray-600">Notes</span>
              <textarea
                rows={2}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditForm(null)} className="rounded-md border px-3 py-2 text-sm">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !editForm.name}
              onClick={submitEdit}
              className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AccountTable({ title, subtitle, accounts, preferAds, onLog, onEdit }) {
  const sorted = useMemo(() => {
    const list = [...accounts]
    if (preferAds) {
      list.sort((a, b) => {
        if (a.category === 'ads' && b.category !== 'ads') return -1
        if (b.category === 'ads' && a.category !== 'ads') return 1
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      })
    }
    return list
  }, [accounts, preferAds])

  return (
    <div className="mb-8">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Last paid</th>
              <th className="px-4 py-3">Next due</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {a.name}
                    {a.category === 'ads' && (
                      <span className="ml-2 text-xs font-normal text-amber-700">ads</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {CATEGORY_LABELS[a.category] || a.category}
                    {a.source !== 'manual' ? ` · ${a.source}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{PRODUCT_LABELS[a.productLine] || a.productLine}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{dollars(a.periodCents)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {a.lastAmountCents != null ? (
                    <>
                      {dollars(a.lastAmountCents)}
                      <div className="text-xs text-gray-400">{fmtDate(a.lastPaidAt)}</div>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{fmtDate(a.nextDueAt)}</td>
                <td className="px-4 py-3">
                  {a.direction === 'cost' ? <StatusPill status={a.paymentHealth} /> : (
                    <span className="text-xs text-gray-400">{a.source?.startsWith('sync:') ? 'synced' : 'manual'}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {a.billingUrl && (
                    <a
                      href={a.billingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-2 text-xs text-brand-600 hover:underline"
                    >
                      Billing
                    </a>
                  )}
                  {onLog && a.direction === 'cost' && a.source === 'manual' && (
                    <button type="button" onClick={() => onLog(a.id)} className="mr-2 text-xs text-brand-600 hover:underline">
                      Log
                    </button>
                  )}
                  <button type="button" onClick={() => onEdit(a)} className="text-xs text-gray-500 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No accounts</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
