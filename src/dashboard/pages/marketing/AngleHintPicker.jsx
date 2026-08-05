/** Toggle chips for BirdNest angle codes under an angle-hints field. */
export default function AngleHintPicker({ angles = [], value = '', onChange }) {
  const selected = new Set(
    String(value || '')
      .split(/[,\n]/)
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean)
  )

  const toggle = (code) => {
    const next = new Set(selected)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    // Keep a stable order matching the offer angle list when possible
    const ordered = angles.map((a) => a.code).filter((c) => next.has(c))
    const extras = [...next].filter((c) => !ordered.includes(c))
    onChange([...ordered, ...extras].join(', '))
  }

  if (!angles.length) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {angles.map((a) => {
        const active = selected.has(a.code)
        return (
          <button
            key={a.code}
            type="button"
            onClick={() => toggle(a.code)}
            title={a.promise}
            className={`rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="font-semibold tracking-wide">{a.code}</span>
            <span className={`mt-0.5 block ${active ? 'text-brand-100' : 'text-gray-500'}`}>
              {a.promise}
            </span>
          </button>
        )
      })}
    </div>
  )
}
