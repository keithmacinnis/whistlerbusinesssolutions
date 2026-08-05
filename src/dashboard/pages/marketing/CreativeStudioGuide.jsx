/**
 * Inline guide for Creative Studio — Series → Themes → Briefs.
 * focus: 'briefs' | 'themes' highlights the matching step.
 */
export default function CreativeStudioGuide({ focus = 'briefs' }) {
  const step = (id) =>
    `rounded-md border px-3 py-2 ${
      focus === id ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white'
    }`

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
      <h2 className="text-sm font-semibold text-gray-900">How Creative Studio works</h2>
      <p className="mt-1 text-gray-600">
        Think of it as a pipeline from <strong>story idea</strong> to <strong>something you can
        paste into CapCut / Arcads today</strong>.
      </p>

      <ol className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <li className={step('themes')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">1. Theme</div>
          <p className="mt-1">
            A full story package: headline, article/caption, video outline, image concept, on-screen
            text, CTA. Often part of a <strong>Series</strong> (e.g. “More Time for What Matters”)
            or a standalone <strong>campaign concept</strong> (e.g. “Digital Nest”).
          </p>
        </li>
        <li className={step('briefs')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">2. Brief</div>
          <p className="mt-1">
            A shippable remix of a theme (or a fresh spark): hooks, timed beats, and a{' '}
            <strong>paste-ready prompt</strong> for a specific format — micro reaction, talking head,
            Seedance one-take, or caption pack.
          </p>
        </li>
        <li className={step('ship')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">3. Ship</div>
          <p className="mt-1">
            Copy the prompt → make the video/post externally → mark the brief{' '}
            <code className="text-xs">prompted</code> when you’ve pasted it into CapCut/Arcads.
          </p>
        </li>
      </ol>

      <div className="mt-3 space-y-1 text-gray-600">
        <p>
          <strong>Recommended flow:</strong> open <em>Themes</em> → pick a story →{' '}
          <em>Generate brief from theme</em> → tweak → Copy prompt → ship 1–2/day.
        </p>
        <p>
          <strong>Skip themes when:</strong> you already know the vibe and just want a quick
          blank-page brief from offer + angle + format.
        </p>
      </div>
    </div>
  )
}
