/**
 * Inline guide for Creative Studio — Ideas → Briefs → Ship.
 * focus: 'briefs' | 'ideas' | 'ship'
 */
export default function CreativeStudioGuide({ focus = 'ideas' }) {
  const step = (id) =>
    `rounded-md border px-3 py-2 ${
      focus === id ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white'
    }`

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
      <h2 className="text-sm font-semibold text-gray-900">How Creative Studio works</h2>
      <p className="mt-1 text-gray-600">
        Pipeline from <strong>story idea</strong> → <strong>paste-ready brief</strong> →{' '}
        <strong>shipped today</strong>.
      </p>

      <ol className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <li className={step('ideas')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">1. Ideas</div>
          <p className="mt-1">
            Start here. Story packages in a <strong>Series</strong>: headline, article, video outline,
            image, on-screen text, CTA.
          </p>
        </li>
        <li className={step('briefs')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">2. Briefs</div>
          <p className="mt-1">
            Remix an idea into hooks, beats, and a <strong>paste-ready prompt</strong>. Each brief gets
            a <strong>tone check</strong> — rewrite anything that reads as depressed/chaos-mom.
          </p>
        </li>
        <li className={step('ship')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">3. Ship</div>
          <p className="mt-1">
            Daily queue: skip low tone scores, copy the prompt, make the piece externally, mark
            prompted when it’s out.
          </p>
        </li>
      </ol>

      <p className="mt-3 text-gray-600">
        <strong>Flow:</strong> Ideas → Briefs → Ship. Aim for 1–2/day.
      </p>
    </div>
  )
}
