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
}

export default function StatusPill({ status }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] || STYLES.draft}`}>
      {status}
    </span>
  )
}
