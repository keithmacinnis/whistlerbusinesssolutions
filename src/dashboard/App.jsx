import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { ViewAsTeacherProvider } from './viewAsTeacher'
import { ViewAsAmbassadorProvider } from './viewAsAmbassador'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import BusinessList from './pages/BusinessList'
import BusinessDetail from './pages/BusinessDetail'
import NewBusinessWizard from './pages/NewBusinessWizard'
import Users from './pages/Users'
import MerchProducts from './pages/merch/MerchProducts'
import MerchOrders from './pages/merch/MerchOrders'
import OnlineStores from './pages/merch/OnlineStores'
import QrCodes from './pages/marketing/QrCodes'
import CreativeStudio from './pages/marketing/CreativeStudio'
import CreativeBriefDetail from './pages/marketing/CreativeBriefDetail'
import CreativeIdeas from './pages/marketing/CreativeIdeas'
import CreativeIdeaDetail from './pages/marketing/CreativeIdeaDetail'
import CreativeVideos from './pages/marketing/CreativeVideos'
import CreativeText from './pages/marketing/CreativeText'
import CreativePosts from './pages/marketing/CreativePosts'
import EducationResources from './pages/education/Resources'
import EducationTeachers from './pages/education/Teachers'
import EducationSessions from './pages/education/Sessions'
import EducationSettlements from './pages/education/Settlements'
import MyCourses from './pages/education/MyCourses'
import EducationAvailability from './pages/education/Availability'
import EducationStudents from './pages/education/Students'
import MyEarnings from './pages/education/MyEarnings'
import Finance from './pages/Finance'
import AmbassadorHub from './pages/ambassador/Hub'
import AmbassadorLinks from './pages/ambassador/Links'
import AmbassadorEarnings from './pages/ambassador/Earnings'
import AmbassadorLeaderboard from './pages/ambassador/Leaderboard'
import AcceptInvite from './pages/ambassador/AcceptInvite'
import AmbassadorsAdmin from './pages/ambassadors/AmbassadorsAdmin'
import AmbassadorSettlements from './pages/ambassadors/Settlements'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function HomeRedirect() {
  const { user } = useAuth()
  if (user?.role === 'teacher') return <Navigate to="/education/my-courses" replace />
  if (user?.role === 'ambassador') return <Navigate to="/ambassador" replace />
  return <Overview />
}

function IdeaSlugRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/marketing/creative/ideas/${slug}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ViewAsTeacherProvider>
        <ViewAsAmbassadorProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/ambassador/accept" element={<AcceptInvite />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<HomeRedirect />} />
              <Route path="businesses" element={<BusinessList />} />
              <Route path="businesses/new" element={<NewBusinessWizard />} />
              <Route path="businesses/:id/*" element={<BusinessDetail />} />
              <Route path="merch/stores" element={<OnlineStores />} />
              <Route path="merch/products" element={<MerchProducts />} />
              <Route path="merch/orders" element={<MerchOrders />} />
              <Route path="marketing/qr-codes" element={<QrCodes />} />
              <Route path="marketing/creative/ideas" element={<CreativeIdeas />} />
              <Route path="marketing/creative/ideas/:slug" element={<CreativeIdeaDetail />} />
              <Route path="marketing/creative/themes" element={<Navigate to="/marketing/creative/ideas" replace />} />
              <Route path="marketing/creative/themes/:slug" element={<IdeaSlugRedirect />} />
              <Route path="marketing/creative/videos" element={<CreativeVideos />} />
              <Route path="marketing/creative/text" element={<CreativeText />} />
              <Route path="marketing/creative/posts" element={<CreativePosts />} />
              <Route path="marketing/creative/ship" element={<Navigate to="/marketing/creative/videos" replace />} />
              <Route path="marketing/creative" element={<CreativeStudio />} />
              <Route path="marketing/creative/:id" element={<CreativeBriefDetail />} />
              <Route path="users" element={<Users />} />
              <Route path="education/resources" element={<EducationResources />} />
              <Route path="education/teachers" element={<EducationTeachers />} />
              <Route path="education/sessions" element={<EducationSessions />} />
              <Route path="education/settlements" element={<EducationSettlements />} />
              <Route path="education/my-courses" element={<MyCourses />} />
              <Route path="education/availability" element={<EducationAvailability />} />
              <Route path="education/students" element={<EducationStudents />} />
              <Route path="education/my-earnings" element={<MyEarnings />} />
              <Route path="ambassadors" element={<AmbassadorsAdmin />} />
              <Route path="ambassadors/settlements" element={<AmbassadorSettlements />} />
              <Route path="ambassadors/leaderboard" element={<AmbassadorLeaderboard />} />
              <Route path="ambassador" element={<AmbassadorHub />} />
              <Route path="ambassador/links" element={<AmbassadorLinks />} />
              <Route path="ambassador/earnings" element={<AmbassadorEarnings />} />
              <Route path="ambassador/leaderboard" element={<AmbassadorLeaderboard />} />
              <Route path="finance" element={<Finance />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ViewAsAmbassadorProvider>
      </ViewAsTeacherProvider>
    </AuthProvider>
  )
}
