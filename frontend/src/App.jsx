import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import useFcm from './hooks/useFcm';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DoctorRegisterPage from './pages/auth/DoctorRegisterPage';
import ClinicOwnerRegisterPage from './pages/auth/ClinicOwnerRegisterPage';
import RoleLoginPage from './pages/auth/RoleLoginPage';
import StaffLoginPage from './pages/auth/StaffLoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PendingVerificationPage from './pages/auth/PendingVerificationPage';
import PortalLandingPage from './pages/auth/PortalLandingPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import PublicHomePage from './pages/public/PublicHomePage';

import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorSearch from './pages/patient/DoctorSearch';
import DoctorProfile from './pages/patient/DoctorProfile';
import MyAppointments from './pages/patient/MyAppointments';
import LiveQueue from './pages/patient/LiveQueue';
import PatientProfile from './pages/patient/PatientProfile';
import PaymentPage from './pages/patient/PaymentPage';

import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorQueue from './pages/doctor/DoctorQueue';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import DoctorSchedulePage from './pages/doctor/DoctorSchedulePage';

import ReceptionDashboard from './pages/receptionist/ReceptionDashboard';
import TodayQueue from './pages/receptionist/TodayQueue';
import WalkInBooking from './pages/receptionist/WalkInBooking';
import FollowUpBooking from './pages/receptionist/FollowUpBooking';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import ClinicProfile from './pages/owner/ClinicProfile';
import ClinicEditResubmit from './pages/owner/ClinicEditResubmit';
import ManageStaff from './pages/owner/ManageStaff';
import OwnerAppointments from './pages/owner/OwnerAppointments';
import QueueOverview from './pages/owner/QueueOverview';

import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import ClinicVerification from './pages/admin/ClinicVerification';
import ClinicVerificationDetail from './pages/admin/ClinicVerificationDetail';
import AdminNotifications from './pages/admin/AdminNotifications';
import NotificationsPage from './pages/notifications/NotificationsPage';
import NotificationSettingsPage from './pages/notifications/NotificationSettingsPage';

const AppRoutes = () => {
  useFcm();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><PublicHomePage /></PublicRoute>} />
      <Route path="/portal" element={<PublicRoute><PortalLandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/staff/login" element={<PublicRoute><StaffLoginPage /></PublicRoute>} />
      <Route path="/login/:role" element={<PublicRoute><RoleLoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/register/doctor" element={<PublicRoute><DoctorRegisterPage /></PublicRoute>} />
      <Route path="/register/clinic-owner" element={<PublicRoute><ClinicOwnerRegisterPage /></PublicRoute>} />
      <Route path="/portal/apply-doctor" element={<PublicRoute><DoctorRegisterPage /></PublicRoute>} />
      <Route path="/portal/apply-clinic" element={<PublicRoute><ClinicOwnerRegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/verification-pending" element={<ProtectedRoute roles={['CLINIC_OWNER', 'DOCTOR']}><PendingVerificationPage /></ProtectedRoute>} />

      <Route path="/patient" element={<Navigate to="/patient/home" replace />} />
      <Route path="/patient/home" element={<ProtectedRoute roles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/search" element={<ProtectedRoute roles={['PATIENT']}><DoctorSearch /></ProtectedRoute>} />
      <Route path="/patient/doctors/:id" element={<ProtectedRoute roles={['PATIENT']}><DoctorProfile /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute roles={['PATIENT']}><MyAppointments /></ProtectedRoute>} />
      <Route path="/patient/appointments/:id" element={<ProtectedRoute roles={['PATIENT']}><MyAppointments /></ProtectedRoute>} />
      <Route path="/patient/queue/:appointmentId" element={<ProtectedRoute roles={['PATIENT']}><LiveQueue /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute roles={['PATIENT']}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/payment/:appointmentId" element={<ProtectedRoute roles={['PATIENT']}><PaymentPage /></ProtectedRoute>} />

      <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
      <Route path="/doctor/dashboard" element={<ProtectedRoute roles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute roles={['DOCTOR']}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/queue" element={<ProtectedRoute roles={['DOCTOR']}><DoctorQueue /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute roles={['DOCTOR']}><DoctorProfilePage /></ProtectedRoute>} />
      <Route path="/doctor/schedule" element={<ProtectedRoute roles={['DOCTOR']}><DoctorSchedulePage /></ProtectedRoute>} />

      <Route path="/reception" element={<Navigate to="/receptionist/dashboard" replace />} />
      <Route path="/reception/queue" element={<Navigate to="/receptionist/queue" replace />} />
      <Route path="/reception/walk-in" element={<Navigate to="/receptionist/walk-in" replace />} />
      <Route path="/reception/follow-up" element={<Navigate to="/receptionist/follow-up" replace />} />
      <Route path="/receptionist/dashboard" element={<ProtectedRoute roles={['RECEPTIONIST']}><ReceptionDashboard /></ProtectedRoute>} />
      <Route path="/receptionist/queue" element={<ProtectedRoute roles={['RECEPTIONIST']}><TodayQueue /></ProtectedRoute>} />
      <Route path="/receptionist/walk-in" element={<ProtectedRoute roles={['RECEPTIONIST']}><WalkInBooking /></ProtectedRoute>} />
      <Route path="/receptionist/follow-up" element={<ProtectedRoute roles={['RECEPTIONIST']}><FollowUpBooking /></ProtectedRoute>} />

      <Route path="/owner" element={<Navigate to="/clinic/dashboard" replace />} />
      <Route path="/owner/clinic" element={<Navigate to="/clinic/profile" replace />} />
      <Route path="/owner/clinic/:id" element={<Navigate to="/clinic/profile" replace />} />
      <Route path="/owner/doctors" element={<Navigate to="/clinic/doctors" replace />} />
      <Route path="/owner/receptionists" element={<Navigate to="/clinic/receptionists" replace />} />
      <Route path="/owner/appointments" element={<Navigate to="/clinic/appointments" replace />} />
      <Route path="/owner/queue" element={<Navigate to="/clinic/queue" replace />} />
      <Route path="/clinic/dashboard" element={<ProtectedRoute roles={['CLINIC_OWNER']}><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/clinic/edit-resubmit" element={<ProtectedRoute roles={['CLINIC_OWNER']}><ClinicEditResubmit /></ProtectedRoute>} />
      <Route path="/clinic/profile" element={<ProtectedRoute roles={['CLINIC_OWNER']}><ClinicProfile /></ProtectedRoute>} />
      <Route path="/clinic/profile/:id" element={<ProtectedRoute roles={['CLINIC_OWNER']}><ClinicProfile /></ProtectedRoute>} />
      <Route path="/clinic/doctors" element={<ProtectedRoute roles={['CLINIC_OWNER']}><ManageStaff staffRole="DOCTOR" /></ProtectedRoute>} />
      <Route path="/clinic/receptionists" element={<ProtectedRoute roles={['CLINIC_OWNER']}><ManageStaff staffRole="RECEPTIONIST" /></ProtectedRoute>} />
      <Route path="/clinic/appointments" element={<ProtectedRoute roles={['CLINIC_OWNER']}><OwnerAppointments /></ProtectedRoute>} />
      <Route path="/clinic/queue" element={<ProtectedRoute roles={['CLINIC_OWNER']}><QueueOverview /></ProtectedRoute>} />

      <Route path="/admin" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['SUPER_ADMIN']} adminLevels={['ROOT', 'SUPER_ADMIN', 'SUPPORT', 'FINANCE']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/clinics" element={<Navigate to="/admin/clinics/verify" replace />} />
      <Route path="/admin/clinics/verify" element={<ProtectedRoute roles={['SUPER_ADMIN']} adminLevels={['ROOT', 'SUPER_ADMIN', 'SUPPORT']}><ClinicVerification /></ProtectedRoute>} />
      <Route path="/admin/clinics/verify/:clinicId" element={<ProtectedRoute roles={['SUPER_ADMIN']} adminLevels={['ROOT', 'SUPER_ADMIN', 'SUPPORT']}><ClinicVerificationDetail /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['SUPER_ADMIN']} adminLevels={['ROOT', 'SUPER_ADMIN', 'SUPPORT', 'FINANCE']}><UsersManagement /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['SUPER_ADMIN']} adminLevels={['ROOT', 'SUPER_ADMIN', 'SUPPORT']}><AdminNotifications /></ProtectedRoute>} />

      <Route path="/notifications" element={<ProtectedRoute roles={['PATIENT','DOCTOR','RECEPTIONIST','CLINIC_OWNER','SUPER_ADMIN']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/notifications/settings" element={<ProtectedRoute roles={['PATIENT','DOCTOR','RECEPTIONIST','CLINIC_OWNER','SUPER_ADMIN']}><NotificationSettingsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
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
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
