const LABELS = {
  brandTone: 'Brand tone',
  formatCompliance: 'Format',
  productTruth: 'Product truth',
  hookStrength: 'Hooks',
  producibility: 'Producibility',
}

export default function QualityBanner({ review }) {
  const result = review?.final || review?.initial
  if (!result) return null

  const passed = review.pass === true
  const style = passed
    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
    : 'border-amber-200 bg-amber-50 text-amber-950'

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${style}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold">
            {passed ? 'Automated creative review passed' : 'Automated review still has concerns'}
            <span className="ml-2 font-mono text-xs font-medium opacity-80">
              score {result.score}/100
            </span>
          </div>
          <p className="mt-1 opacity-90">{result.summary}</p>
        </div>
        {review.repaired && (
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold">
            Self-repaired
          </span>
        )}
      </div>

      {result.dimensions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(result.dimensions).map(([key, value]) => (
            <span key={key} className="rounded-md bg-white/70 px-2 py-1 text-xs">
              {LABELS[key] || key}: <strong>{value.score}</strong>
            </span>
          ))}
        </div>
      )}

      {!!review.changedFields?.length && (
        <p className="mt-3 text-xs">
          <strong>Last rewrite changed:</strong> {review.changedFields.join(', ')}
        </p>
      )}

      {!!result.blockingIssues?.length && (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-xs">
          {result.blockingIssues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
