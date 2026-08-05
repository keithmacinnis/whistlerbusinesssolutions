/**
 * Inline guide for Creative Studio — Ideas → Briefs → Videos → Post.
 * focus: 'briefs' | 'ideas' | 'videos' | 'posts' | 'ship' (ship → videos)
 */
export default function CreativeStudioGuide({ focus = 'ideas' }) {
  const active = focus === 'ship' ? 'videos' : focus
  const step = (id) =>
    `rounded-md border px-3 py-2 ${
      active === id ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white'
    }`

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
      <h2 className="text-sm font-semibold text-gray-900">How Creative Studio works</h2>
      <p className="mt-1 text-gray-600">
        Pipeline from <strong>story idea</strong> → <strong>brief</strong> → <strong>video file</strong>{' '}
        → <strong>posted</strong>.
      </p>

      <ol className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <li className={step('ideas')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">1. Ideas</div>
          <p className="mt-1">Story packages by series & author. Derive with AI to branch.</p>
        </li>
        <li className={step('briefs')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">2. Briefs</div>
          <p className="mt-1">Paste-ready prompts + tone check before you make the cut.</p>
        </li>
        <li className={step('videos')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">3. Videos</div>
          <p className="mt-1">
            Flip briefs into files. <strong>Flipped</strong> briefs can make an Nth video anytime.
          </p>
        </li>
        <li className={step('posts')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">4. Post</div>
          <p className="mt-1">
            Ready to post → record each publish. Same video can post more than once.
          </p>
        </li>
      </ol>
    </div>
  )
}
