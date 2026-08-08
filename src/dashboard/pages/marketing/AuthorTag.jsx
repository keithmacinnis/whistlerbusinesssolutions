/** Small circle badge for Creative Studio authorship (usually first letter of email). */
export default function AuthorTag({ tag, title, className = '' }) {
  if (!tag) return null
  const letter = String(tag).trim().slice(0, 2).toUpperCase() || '?'
  return (
    <span
      title={title || `Author ${letter}`}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-[11px] font-bold text-white ${className}`}
    >
      {letter}
    </span>
  )
}
