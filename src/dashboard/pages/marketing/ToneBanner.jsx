const TONE_STYLES = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  mixed: 'border-amber-200 bg-amber-50 text-amber-900',
  caution: 'border-orange-200 bg-orange-50 text-orange-950',
  negative: 'border-red-200 bg-red-50 text-red-900',
}

const CHIP_STYLES = {
  positive: 'bg-emerald-50 text-emerald-800',
  mixed: 'bg-amber-50 text-amber-800',
  caution: 'bg-orange-50 text-orange-900',
  negative: 'bg-red-50 text-red-800',
}

export function ToneChip({ tone, className = '' }) {
  if (!tone?.label) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        CHIP_STYLES[tone.label] || CHIP_STYLES.mixed
      } ${className}`}
      title={tone.summary || ''}
    >
      Tone {tone.score != null ? `${tone.score}` : tone.label}
      {!tone.pass && tone.label !== 'positive' ? ' ⚠' : ''}
    </span>
  )
}

export default function ToneBanner({ tone, onRecheck, checking }) {
  if (!tone) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <p>No tone check yet — run one before shipping to catch depressed/chaos framing.</p>
        {onRecheck && (
          <button
            type="button"
            onClick={onRecheck}
            disabled={checking}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Check tone'}
          </button>
        )}
      </div>
    )
  }

  const style = TONE_STYLES[tone.label] || TONE_STYLES.mixed
  const heading =
    tone.label === 'positive'
      ? 'Tone looks good'
      : tone.label === 'negative'
        ? 'Tone fails brand bar'
        : 'Tone needs a rewrite pass'

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${style}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold">
            {heading}
            {tone.score != null ? (
              <span className="ml-2 font-mono text-xs font-medium opacity-80">score {tone.score}/100</span>
            ) : null}
          </div>
          <p className="mt-1 opacity-90">{tone.summary}</p>
        </div>
        {onRecheck && (
          <button
            type="button"
            onClick={onRecheck}
            disabled={checking}
            className="shrink-0 rounded-md border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-medium hover:bg-white disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Re-check tone'}
          </button>
        )}
      </div>
      {!!tone.flags?.length && (
        <ul className="mt-3 space-y-1.5">
          {tone.flags.map((f) => (
            <li key={`${f.id}-${f.label}`} className="text-xs">
              <span className="font-semibold">{f.label}</span>
              {f.excerpt ? <span className="opacity-80"> — “{f.excerpt}”</span> : null}
            </li>
          ))}
        </ul>
      )}
      {!!tone.suggestions?.length && (
        <div className="mt-3 border-t border-black/10 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Suggestions</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
            {tone.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
