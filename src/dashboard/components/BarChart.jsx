// Tiny dependency-free SVG bar chart for daily counts: [{ day, count }].
export default function BarChart({ points, height = 120, label, barClassName = 'fill-brand-500' }) {
  if (!points?.length) {
    return <div className="flex h-24 items-center justify-center text-sm text-gray-400">No data in this period.</div>
  }
  const max = Math.max(...points.map((p) => p.count), 1)
  const barWidth = 100 / points.length
  const total = points.reduce((sum, p) => sum + (p.count || 0), 0)

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-32 w-full">
        {points.map((p, i) => {
          const h = (p.count / max) * (height - 14)
          return (
            <g key={p.day}>
              <rect
                x={i * barWidth + barWidth * 0.15}
                y={height - h}
                width={barWidth * 0.7}
                height={Math.max(h, p.count > 0 ? 1 : 0)}
                rx="1"
                className={barClassName}
              >
                <title>{`${String(p.day).slice(0, 10)}: ${p.count}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>{String(points[0].day).slice(0, 10)}</span>
        {label && (
          <span>
            {label} · {total.toLocaleString()} total · max {max}/day
          </span>
        )}
        <span>{String(points[points.length - 1].day).slice(0, 10)}</span>
      </div>
    </div>
  )
}
