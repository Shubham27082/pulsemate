import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { resetPassword, verifyResetToken } from '../../api/auth.api';

const PASSWORD_REQUIREMENTS = [
  'Minimum 8 characters',
  'At least one uppercase letter',
  'At least one lowercase letter',
  'At least one number',
  'At least one special character',
];

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenState, setTokenState] = useState({ valid: false, message: '' });

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenState({ valid: false, message: 'Reset link is invalid or expired. Please request a new password reset.' });
        setIsVerifying(false);
        return;
      }

      try {
        const response = await verifyResetToken(token);
        setTokenState({ valid: !!response.data.valid, message: '' });
      } catch (error) {
        setTokenState({
          valid: false,
          message: error.response?.data?.message || 'Reset link is invalid or expired. Please request a new password reset.',
        });
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Password and confirm password must match');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      toast.success('Password reset successfully. Please login again.');
      navigate('/staff/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reset password</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new password for your staff or admin account.</p>
      </div>

      {isVerifying ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-600">
          Verifying reset link...
        </div>
      ) : !tokenState.valid ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {tokenState.message || 'Reset link is invalid or expired. Please request a new password reset.'}
          </div>
          <Link
            to="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Password requirements:
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {PASSWORD_REQUIREMENTS.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                placeholder="New strong password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              placeholder="Confirm your new password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-gray-100 pt-6 text-center">
        <Link to="/staff/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          Back to staff login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
