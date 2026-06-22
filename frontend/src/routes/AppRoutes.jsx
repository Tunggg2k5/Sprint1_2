import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import AuthPage from "../pages/AuthPage.jsx";
import BookingPage from "../pages/BookingPage.jsx";
import PatientDashboard from "../pages/PatientDashboard.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import PublicHome from "../pages/PublicHome.jsx";
import ReceptionistDashboard from "../pages/ReceptionistDashboard.jsx";

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "patient") return <PatientDashboard />;
  if (user.role === "receptionist") return <ReceptionistDashboard />;
  return <Navigate to="/" replace />;
}

function PublicHomeRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <PublicHome />;
}

function PatientBookingRoute() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "patient") return <Navigate to="/dashboard" replace />;
  return <BookingPage />;
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<PublicHomeRoute />} />
        <Route path="/dat-lich-hen" element={<PublicHomeRoute />} />
        <Route path="/booking" element={<PatientBookingRoute />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
