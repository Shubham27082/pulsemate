import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import useFcm from './hooks/useFcm';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SelectRolePage from './pages/auth/SelectRolePage';
import RoleLoginPage from './pages/auth/RoleLoginPage';

// Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorSearch from './pages/patient/DoctorSearch';
import DoctorProfile from './pages/patient/DoctorProfile';
import MyAppointments from './pages/patient/MyAppointments';
import LiveQueue from './pages/patient/LiveQueue';
import PatientProfile from './pages/patient/PatientProfile';
import MyPrescriptions from './pages/patient/MyPrescriptions';
import PaymentPage from './pages/patient/PaymentPage';

// Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorQueue from './pages/doctor/DoctorQueue';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import WritePrescription from './pages/doctor/WritePrescription';

// Receptionist
import ReceptionDashboard from './pages/receptionist/ReceptionDashboard';
import TodayQueue from './pages/receptionist/TodayQueue';
import WalkInBooking from './pages/receptionist/WalkInBooking';
import FollowUpBooking from './pages/receptionist/FollowUpBooking';

// Owner
import OwnerDashboard from './pages/owner/OwnerDashboard';
import ClinicProfile from './pages/owner/ClinicProfile';
import ManageStaff from './pages/owner/ManageStaff';
import OwnerAppointments from './pages/owner/OwnerAppointments';
import QueueOverview from './pages/owner/QueueOverview';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ClinicApprovals from './pages/admin/ClinicApprovals';
import UsersManagement from './pages/admin/UsersManagement';

const AppRoutes = () => {
  useFcm();
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login"           element={<PublicRoute><SelectRolePage /></PublicRoute>} />
      <Route path="/login/:role"     element={<PublicRoute><RoleLoginPage /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Patient */}
      <Route path="/patient"                        element={<ProtectedRoute roles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/search"                 element={<ProtectedRoute roles={['PATIENT']}><DoctorSearch /></ProtectedRoute>} />
      <Route path="/patient/doctors/:id"            element={<ProtectedRoute roles={['PATIENT']}><DoctorProfile /></ProtectedRoute>} />
      <Route path="/patient/appointments"           element={<ProtectedRoute roles={['PATIENT']}><MyAppointments /></ProtectedRoute>} />
      <Route path="/patient/appointments/:id"       element={<ProtectedRoute roles={['PATIENT']}><MyAppointments /></ProtectedRoute>} />
      <Route path="/patient/queue/:appointmentId"   element={<ProtectedRoute roles={['PATIENT']}><LiveQueue /></ProtectedRoute>} />
      <Route path="/patient/profile"                element={<ProtectedRoute roles={['PATIENT']}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/prescriptions"          element={<ProtectedRoute roles={['PATIENT']}><MyPrescriptions /></ProtectedRoute>} />
      <Route path="/patient/payment/:appointmentId" element={<ProtectedRoute roles={['PATIENT']}><PaymentPage /></ProtectedRoute>} />

      {/* Doctor */}
      <Route path="/doctor"                                element={<ProtectedRoute roles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments"                   element={<ProtectedRoute roles={['DOCTOR']}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/queue"                          element={<ProtectedRoute roles={['DOCTOR']}><DoctorQueue /></ProtectedRoute>} />
      <Route path="/doctor/profile"                        element={<ProtectedRoute roles={['DOCTOR']}><DoctorProfilePage /></ProtectedRoute>} />
      <Route path="/doctor/prescription/:appointmentId"    element={<ProtectedRoute roles={['DOCTOR']}><WritePrescription /></ProtectedRoute>} />

      {/* Receptionist */}
      <Route path="/reception"            element={<ProtectedRoute roles={['RECEPTIONIST']}><ReceptionDashboard /></ProtectedRoute>} />
      <Route path="/reception/queue"      element={<ProtectedRoute roles={['RECEPTIONIST']}><TodayQueue /></ProtectedRoute>} />
      <Route path="/reception/walk-in"    element={<ProtectedRoute roles={['RECEPTIONIST']}><WalkInBooking /></ProtectedRoute>} />
      <Route path="/reception/follow-up"  element={<ProtectedRoute roles={['RECEPTIONIST']}><FollowUpBooking /></ProtectedRoute>} />

      {/* Owner */}
      <Route path="/owner"                element={<ProtectedRoute roles={['CLINIC_OWNER']}><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/owner/clinic"         element={<ProtectedRoute roles={['CLINIC_OWNER']}><ClinicProfile /></ProtectedRoute>} />
      <Route path="/owner/clinic/:id"     element={<ProtectedRoute roles={['CLINIC_OWNER']}><ClinicProfile /></ProtectedRoute>} />
      <Route path="/owner/doctors"        element={<ProtectedRoute roles={['CLINIC_OWNER']}><ManageStaff staffRole="DOCTOR" /></ProtectedRoute>} />
      <Route path="/owner/receptionists"  element={<ProtectedRoute roles={['CLINIC_OWNER']}><ManageStaff staffRole="RECEPTIONIST" /></ProtectedRoute>} />
      <Route path="/owner/appointments"   element={<ProtectedRoute roles={['CLINIC_OWNER']}><OwnerAppointments /></ProtectedRoute>} />
      <Route path="/owner/queue"          element={<ProtectedRoute roles={['CLINIC_OWNER']}><QueueOverview /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin"          element={<ProtectedRoute roles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/clinics"  element={<ProtectedRoute roles={['SUPER_ADMIN']}><ClinicApprovals /></ProtectedRoute>} />
      <Route path="/admin/users"    element={<ProtectedRoute roles={['SUPER_ADMIN']}><UsersManagement /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // No loading gate — render immediately, ProtectedRoute handles auth checks
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#111827',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
