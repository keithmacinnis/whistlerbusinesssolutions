/**
 * Inline guide for Creative Studio — Ideas → Briefs → Videos/Text → Post.
 * focus: 'briefs' | 'ideas' | 'videos' | 'text' | 'posts' | 'ship'
 */
export default function CreativeStudioGuide({ focus = 'ideas' }) {
  const active = focus === 'ship' ? 'videos' : focus
  const step = (id) =>
    `rounded-md border px-3 py-2 ${
      active === id || (id === 'media' && (active === 'videos' || active === 'text'))
        ? 'border-brand-300 bg-brand-50'
        : 'border-gray-200 bg-white'
    }`

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
      <h2 className="text-sm font-semibold text-gray-900">How Creative Studio works</h2>
      <p className="mt-1 text-gray-600">
        Pipeline from <strong>idea</strong> → <strong>brief</strong> → <strong>video or text</strong>{' '}
        → <strong>posted</strong>.
      </p>

      <ol className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <li className={step('ideas')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">1. Ideas</div>
          <p className="mt-1">Story packages by series & author. Derive with AI to branch.</p>
        </li>
        <li className={step('briefs')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">2. Briefs</div>
          <p className="mt-1">
            Paste-ready prompts for <strong>video</strong> or <strong>story/meme</strong> formats +
            tone check.
          </p>
        </li>
        <li className={step('media')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            3. Videos / Text
          </div>
          <p className="mt-1">
            Flip briefs into files — video cuts, or story posts & meme stills.
          </p>
        </li>
        <li className={step('posts')}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">4. Post</div>
          <p className="mt-1">
            Ready to post → record each publish. Same asset can post more than once.
          </p>
        </li>
      </ol>
    </div>
  )
}
