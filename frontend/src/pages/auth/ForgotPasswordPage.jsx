import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { forgotPassword } from '../../api/auth.api';

const SAFE_SUCCESS_MESSAGE = 'If an account exists with this email, password reset instructions have been sent.';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success(SAFE_SUCCESS_MESSAGE);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to process request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Forgot password</h1>
        <p className="text-sm text-gray-500 mt-1">This page is for staff and admin accounts only.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="doctor@example.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
          />
        </div>

        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {SAFE_SUCCESS_MESSAGE}
          </div>
        ) : null}

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Patients login using mobile OTP. No password required.
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-6 text-center">
        <Link to="/staff/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          Back to staff login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
