import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { useViewAsTeacher } from '../viewAsTeacher'
import { useViewAsAmbassador } from '../viewAsAmbassador'
import { formatRoles, hasRole } from '../roles'

const navLinkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  }`

export default function Layout() {
  const { user, logout } = useAuth()
  const { viewAs, clearViewAs } = useViewAsTeacher()
  const { viewAs: viewAsAmb, clearViewAs: clearViewAsAmb } = useViewAsAmbassador()
  const navigate = useNavigate()
  const isTeacher = hasRole(user, 'teacher')
  const isAmbassador = hasRole(user, 'ambassador')
  const isSuper = hasRole(user, 'super_admin')
  const viewingAsTeacher = isSuper && !!viewAs
  const viewingAsAmbassador = isSuper && !!viewAsAmb
  // When god-mode is on, show the teacher/ambassador portal nav as they would see it.
  // Real dual-role users see both Education + Selling sections.
  const showTeacherNav = isTeacher || viewingAsTeacher
  const showAmbassadorNav = (isAmbassador || viewingAsAmbassador) && !viewingAsTeacher
  const showAdminNav = isSuper && !viewingAsTeacher && !viewingAsAmbassador

  const exitGodMode = () => {
    if (viewingAsAmbassador) {
      clearViewAsAmb()
      navigate('/ambassadors')
      return
    }
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

          {(showAdminNav || showTeacherNav) && (
            <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Education
            </div>
          )}
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

          {showAmbassadorNav && (
            <>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Selling
              </div>
              <NavLink to="/ambassador" end className={navLinkClass}>Hub</NavLink>
              <NavLink to="/ambassador/links" className={navLinkClass}>Links &amp; QR</NavLink>
              <NavLink to="/ambassador/earnings" className={navLinkClass}>Earnings</NavLink>
              <NavLink to="/ambassador/leaderboard" className={navLinkClass}>Leaderboard</NavLink>
            </>
          )}

          {showAdminNav && (
            <>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ambassadors
              </div>
              <NavLink to="/ambassadors" end className={navLinkClass}>Family sellers</NavLink>
              <NavLink to="/ambassadors/settlements" className={navLinkClass}>Seller payouts</NavLink>
              <NavLink to="/ambassadors/leaderboard" className={navLinkClass}>Leaderboard</NavLink>
            </>
          )}

          {(showAdminNav || showAmbassadorNav) && (
            <>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Marketing
              </div>
              <NavLink to="/marketing/qr-codes" className={navLinkClass}>Campaign tracking</NavLink>
              <NavLink to="/marketing/creative" className={navLinkClass}>Creative Studio</NavLink>
            </>
          )}

          {showAdminNav && (
            <>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Finance
              </div>
              <NavLink to="/finance" className={navLinkClass}>P&amp;L</NavLink>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Admin
              </div>
              <NavLink to="/users" className={navLinkClass}>Users</NavLink>
              <NavLink to="/onboarding-emails" className={navLinkClass}>Onboarding emails</NavLink>
            </>
          )}
        </nav>
        <div className="border-t border-gray-800 pt-3">
          <div className="truncate px-3 text-sm text-gray-300">{user?.email || user?.name}</div>
          <div className="truncate px-3 text-xs text-gray-500">{formatRoles(user)}</div>
          <button
            onClick={logout}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-x-auto">
        {(viewingAsTeacher || viewingAsAmbassador) && (
          <div className="flex items-center justify-between gap-4 bg-amber-500 px-6 py-2.5 text-sm text-amber-950">
            <div>
              <span className="font-semibold">God mode</span>
              <span className="mx-2 opacity-60">·</span>
              Viewing as{' '}
              <span className="font-semibold">
                {(viewingAsAmbassador ? viewAsAmb : viewAs)?.name ||
                  (viewingAsAmbassador ? viewAsAmb : viewAs)?.email}
              </span>
              {viewingAsAmbassador && viewAsAmb?.code && (
                <span className="opacity-70"> (@{viewAsAmb.code})</span>
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
