import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, Navigate, NavLink, useParams } from 'react-router-dom'
import { api } from '../api'
import StatusPill from '../components/StatusPill'
import OverviewTab from './tabs/OverviewTab'
import ProductsTab from './tabs/ProductsTab'
import ScriptsTab from './tabs/ScriptsTab'
import VoiceTab from './tabs/VoiceTab'
import CallLogsTab from './tabs/CallLogsTab'
import SettingsTab from './tabs/SettingsTab'

const TABS = [
  { path: 'overview', label: 'Overview' },
  { path: 'products', label: 'Products' },
  { path: 'scripts', label: 'Scripts & Prompt' },
  { path: 'voice', label: 'Voice & Phone' },
  { path: 'calls', label: 'Call Logs' },
  { path: 'settings', label: 'Settings' },
]

export default function BusinessDetail() {
  const { id } = useParams()
  const [business, setBusiness] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    api(`/api/voice/businesses/${id}`)
      .then(({ business }) => setBusiness(business))
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(reload, [reload])

  if (error) return <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
  if (!business) return <div className="text-gray-500">Loading…</div>

  const tabProps = { business, reload }

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
        <StatusPill status={business.status} />
      </div>
      <div className="mb-5 text-sm text-gray-500">
        {business.phoneNumber || 'No phone number yet'} · /{business.slug}
      </div>

      <nav className="mb-6 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <NavLink
            key={t.path}
            to={t.path}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewTab {...tabProps} />} />
        <Route path="products" element={<ProductsTab {...tabProps} />} />
        <Route path="scripts" element={<ScriptsTab {...tabProps} />} />
        <Route path="voice" element={<VoiceTab {...tabProps} />} />
        <Route path="calls" element={<CallLogsTab {...tabProps} />} />
        <Route path="settings" element={<SettingsTab {...tabProps} />} />
      </Routes>
    </div>
  )
}
