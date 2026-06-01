import { Navigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import useAuthStore from '../../store/authStore';

const copyByRole = {
  CLINIC_OWNER:
    'Your clinic verification is pending. You can access your account, but bookings and staff management will activate after approval.',
  DOCTOR:
    'Your doctor profile verification is pending. You can access your profile, but bookings will activate after approval.',
};

const PendingVerificationPage = () => {
  const user = useAuthStore((state) => state.user);

  if (!user || !['CLINIC_OWNER', 'DOCTOR'].includes(user.role) || user.status === 'VERIFIED') {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout>
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Verification pending</p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Account review in progress</h1>
        <p className="mt-3 text-sm leading-6 text-gray-700">{copyByRole[user.role]}</p>
      </div>
    </AuthLayout>
  );
};

export default PendingVerificationPage;
