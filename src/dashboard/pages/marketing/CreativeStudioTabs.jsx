import { NavLink, useLocation } from 'react-router-dom'

const tabClass = ({ isActive }) =>
  `rounded-md px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
    isActive
      ? 'bg-brand-600 text-white shadow-sm'
      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
  }`

const stackedClass = (isActive) =>
  `block rounded-md px-4 py-1.5 text-center text-sm font-semibold tracking-wide transition-colors ${
    isActive
      ? 'bg-brand-600 text-white shadow-sm'
      : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`

export default function CreativeStudioTabs() {
  const { pathname } = useLocation()
  const mediaActive =
    pathname.includes('/marketing/creative/videos') ||
    pathname.includes('/marketing/creative/text')

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <NavLink to="/marketing/creative/ideas" className={tabClass}>
        Ideas
      </NavLink>
      <NavLink to="/marketing/creative" end className={tabClass}>
        Briefs
      </NavLink>

      {/* Videos + Text stack — the “bulge” in the middle of the bar */}
      <div
        className={`flex flex-col gap-1 rounded-lg p-1 ring-1 ${
          mediaActive ? 'bg-brand-50 ring-brand-200' : 'bg-gray-50 ring-gray-200'
        }`}
      >
        <NavLink
          to="/marketing/creative/videos"
          className={({ isActive }) => stackedClass(isActive)}
        >
          Videos
        </NavLink>
        <NavLink
          to="/marketing/creative/text"
          className={({ isActive }) => stackedClass(isActive)}
        >
          Text
        </NavLink>
      </div>

      <NavLink to="/marketing/creative/posts" className={tabClass}>
        Post
      </NavLink>
    </div>
  )
}
