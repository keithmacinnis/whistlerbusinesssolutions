import { useState } from 'react'

/**
 * Format select with a ? help toggle listing every format’s description.
 */
export default function FormatSelect({ formats, value, onChange, id = 'format' }) {
  const [open, setOpen] = useState(false)
  const selected = formats.find((f) => f.slug === value)

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          Format
        </label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="What do these formats mean?"
          title="What do these formats mean?"
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold leading-none ring-1 transition ${
            open
              ? 'bg-brand-600 text-white ring-brand-600'
              : 'bg-white text-gray-500 ring-gray-300 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          ?
        </button>
      </div>

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      >
        {formats.map((f) => (
          <option key={f.slug} value={f.slug}>
            {f.name}
            {f.lengthHint ? ` (${f.lengthHint})` : ''}
          </option>
        ))}
      </select>

      {!open && selected?.description && (
        <p className="mt-1 text-xs font-normal text-gray-400">{selected.description}</p>
      )}

      {open && (
        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            What each format is for
          </p>
          {formats.map((f) => {
            const active = f.slug === value
            return (
              <button
                key={f.slug}
                type="button"
                onClick={() => {
                  onChange(f.slug)
                  setOpen(false)
                }}
                className={`block w-full rounded-md px-2.5 py-2 text-left transition ${
                  active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{f.name}</span>
                  {f.kind && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                      {f.kind}
                    </span>
                  )}
                  {active && (
                    <span className="text-[10px] font-semibold uppercase text-brand-700">selected</span>
                  )}
                </div>
                {f.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{f.description}</p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
