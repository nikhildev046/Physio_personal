import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "./store/AppContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Availability from "./pages/Availability.jsx";
import Calendar from "./pages/Calendar.jsx";
import Bookings from "./pages/Bookings.jsx";
import Patients from "./pages/Patients.jsx";
import PatientProfile from "./pages/PatientProfile.jsx";
import Sessions from "./pages/Sessions.jsx";
import Exercises from "./pages/Exercises.jsx";
import Payments from "./pages/Payments.jsx";
import Notifications from "./pages/Notifications.jsx";

export default function App() {
  const { authed, booting } = useApp();

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-50 text-brand-500">
        Loading PhysioFlow…
      </div>
    );
  }

  if (!authed) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientProfile />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
