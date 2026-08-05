import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { useViewAsTeacher } from '../viewAsTeacher'

const navLinkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  }`

export default function Layout() {
  const { user, logout } = useAuth()
  const { viewAs, clearViewAs } = useViewAsTeacher()
  const navigate = useNavigate()
  const isTeacher = user?.role === 'teacher'
  const isSuper = user?.role === 'super_admin'
  const viewingAsTeacher = isSuper && !!viewAs
  // When god-mode is on, show the teacher portal nav as that teacher would see it.
  const showTeacherNav = isTeacher || viewingAsTeacher
  const showAdminNav = isSuper && !viewingAsTeacher

  const exitGodMode = () => {
    clearViewAs()
    navigate('/education/teachers')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex w-56 flex-col bg-gray-900 p-4">
        <div className="mb-6 px-3">
          <div className="text-lg font-bold text-white">WBS Dashboard</div>
          <div className="text-xs text-gray-400">Commerce Platform</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {showAdminNav && (
            <>
              <NavLink to="/" end className={navLinkClass}>Overview</NavLink>
              <NavLink to="/businesses" className={navLinkClass}>Call Centres</NavLink>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Commerce
              </div>
              <NavLink to="/merch/stores" className={navLinkClass}>Online Stores</NavLink>
              <NavLink to="/merch/products" className={navLinkClass}>Products</NavLink>
              <NavLink to="/merch/orders" className={navLinkClass}>Orders</NavLink>
            </>
          )}

          <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Education
          </div>
          {showAdminNav && (
            <>
              <NavLink to="/education/resources" className={navLinkClass}>Resources</NavLink>
              <NavLink to="/education/teachers" className={navLinkClass}>Teachers</NavLink>
              <NavLink to="/education/sessions" className={navLinkClass}>Sessions</NavLink>
              <NavLink to="/education/settlements" className={navLinkClass}>Settlements</NavLink>
            </>
          )}
          {showTeacherNav && (
            <>
              <NavLink to="/education/my-courses" className={navLinkClass}>My courses</NavLink>
              <NavLink to="/education/availability" className={navLinkClass}>Availability</NavLink>
              <NavLink to="/education/students" className={navLinkClass}>Students</NavLink>
              <NavLink to="/education/my-earnings" className={navLinkClass}>My earnings</NavLink>
            </>
          )}

          {showAdminNav && (
            <>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Marketing
              </div>
              <NavLink to="/marketing/qr-codes" className={navLinkClass}>QR Codes</NavLink>
              <NavLink to="/marketing/creative" className={navLinkClass}>Creative Studio</NavLink>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Finance
              </div>
              <NavLink to="/finance" className={navLinkClass}>P&amp;L</NavLink>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Admin
              </div>
              <NavLink to="/users" className={navLinkClass}>Users</NavLink>
            </>
          )}
        </nav>
        <div className="border-t border-gray-800 pt-3">
          <div className="truncate px-3 text-sm text-gray-300">{user?.email || user?.name}</div>
          <div className="truncate px-3 text-xs text-gray-500">{user?.role?.replace(/_/g, ' ')}</div>
          <button
            onClick={logout}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-x-auto">
        {viewingAsTeacher && (
          <div className="flex items-center justify-between gap-4 bg-amber-500 px-6 py-2.5 text-sm text-amber-950">
            <div>
              <span className="font-semibold">God mode</span>
              <span className="mx-2 opacity-60">·</span>
              Viewing as{' '}
              <span className="font-semibold">{viewAs.name || viewAs.email}</span>
              {viewAs.email && viewAs.name && (
                <span className="opacity-70"> ({viewAs.email})</span>
              )}
              {viewAs.status && viewAs.status !== 'approved' && (
                <span className="ml-2 rounded bg-amber-900/20 px-1.5 py-0.5 text-xs font-medium">
                  {viewAs.status}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={exitGodMode}
              className="shrink-0 rounded-md bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-black"
            >
              Exit god mode
            </button>
          </div>
        )}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
