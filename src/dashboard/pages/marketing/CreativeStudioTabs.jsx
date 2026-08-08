import { NavLink, useLocation } from 'react-router-dom'

const STEPS = [
  { id: 'ideas', label: 'Ideas', to: '/marketing/creative/ideas', end: false },
  { id: 'briefs', label: 'Briefs', to: '/marketing/creative', end: true },
  {
    id: 'media',
    children: [
      { id: 'videos', label: 'Videos', to: '/marketing/creative/videos' },
      { id: 'text', label: 'Text', to: '/marketing/creative/text' },
    ],
  },
  { id: 'posts', label: 'Post', to: '/marketing/creative/posts', end: false },
]

function FlowArrow({ state }) {
  // state: 'done' | 'next' | 'todo'
  const color =
    state === 'done' ? 'text-brand-500' : state === 'next' ? 'text-brand-600' : 'text-gray-300'

  return (
    <div
      className={`mx-1 flex shrink-0 items-center transition-colors duration-300 ${color}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 20"
        className={`h-5 w-10 overflow-visible ${
          state === 'next' ? 'animate-[flow-nudge_1.4s_ease-in-out_infinite]' : ''
        }`}
        fill="none"
      >
        <path d="M3 10h26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M24 4 34 10 24 16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function stepActive(step, pathname, briefDetailActive) {
  if (step.id === 'ideas') return pathname.includes('/marketing/creative/ideas')
  if (step.id === 'briefs') {
    return (
      pathname === '/marketing/creative' ||
      pathname === '/marketing/creative/' ||
      briefDetailActive
    )
  }
  if (step.id === 'media') {
    return (
      pathname.includes('/marketing/creative/videos') ||
      pathname.includes('/marketing/creative/text')
    )
  }
  if (step.id === 'posts') return pathname.includes('/marketing/creative/posts')
  return false
}

export default function CreativeStudioTabs() {
  const { pathname } = useLocation()
  const briefDetailActive =
    /^\/marketing\/creative\/(?!ideas(?:\/|$)|videos(?:\/|$)|text(?:\/|$)|posts(?:\/|$)|ship(?:\/|$))[^/]+\/?$/.test(
      pathname
    )

  const activeIndex = STEPS.findIndex((step) => stepActive(step, pathname, briefDetailActive))

  return (
    <div className="mb-6">
      <style>{`
        @keyframes flow-nudge {
          0%, 100% { transform: translateX(0); opacity: 0.85; }
          50% { transform: translateX(5px); opacity: 1; }
        }
      `}</style>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Creative flow
      </div>
      <nav
        aria-label="Creative Studio steps"
        className="mt-2 flex flex-wrap items-center gap-y-3"
      >
        {STEPS.map((step, i) => {
          const active = stepActive(step, pathname, briefDetailActive)
          const reached = activeIndex >= 0 && i <= activeIndex
          const arrowState =
            activeIndex < 0
              ? 'todo'
              : i < activeIndex
                ? 'done'
                : i === activeIndex
                  ? 'next'
                  : 'todo'

          return (
            <div key={step.id} className="flex items-center">
              {step.children ? (
                <div
                  className={`flex flex-col gap-1 rounded-xl p-1 ring-1 transition-all duration-300 ${
                    active
                      ? 'bg-brand-50 shadow-sm ring-brand-300'
                      : reached
                        ? 'bg-brand-50/50 ring-brand-200'
                        : 'bg-gray-50 ring-gray-200'
                  }`}
                >
                  {step.children.map((child) => (
                    <NavLink
                      key={child.id}
                      to={child.to}
                      className={({ isActive }) =>
                        `rounded-lg px-4 py-1.5 text-center text-sm font-semibold tracking-wide transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  to={step.to}
                  end={step.end}
                  className={() =>
                    `rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 ${
                      active
                        ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-300 ring-offset-1'
                        : reached
                          ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100'
                          : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {step.label}
                </NavLink>
              )}

              {i < STEPS.length - 1 && <FlowArrow state={arrowState} />}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
