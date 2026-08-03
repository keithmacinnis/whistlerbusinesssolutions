const STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  live: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-700',
  paid: 'bg-blue-100 text-blue-800',
  fulfilled: 'bg-green-100 text-green-800',
  needs_fulfillment: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-yellow-100 text-yellow-800',
  // Finance payment health
  ok: 'bg-green-100 text-green-800',
  due_soon: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-600',
  'n/a': 'bg-gray-50 text-gray-400',
  active: 'bg-green-100 text-green-800',
  ended: 'bg-gray-100 text-gray-600',
}

export default function StatusPill({ status }) {
  const label = String(status || 'draft').replace(/_/g, ' ')
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] || STYLES.draft}`}>
      {label}
    </span>
  )
}
