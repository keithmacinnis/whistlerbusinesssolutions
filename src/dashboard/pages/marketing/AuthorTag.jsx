/** Compact badge for Creative Studio authorship (email local-part, up to 6 chars). */
export default function AuthorTag({ tag, title, className = '' }) {
  if (!tag) return null
  const label = String(tag).trim().slice(0, 6).toUpperCase() || '?'
  return (
    <span
      title={title || `Author ${label}`}
      className={`inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-gray-800 px-2 text-[10px] font-bold tracking-wide text-white ${className}`}
    >
      {label}
    </span>
  )
}
