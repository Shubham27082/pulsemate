import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { sendOtp, verifyOtp } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';

const LoginPage = () => {
  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const startCountdown = () => {
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (event) => {
    event?.preventDefault();
    if (!mobile.trim()) return toast.error('Enter your mobile number');

    setIsLoading(true);
    try {
      const response = await sendOtp(mobile);
      setStep('otp');
      startCountdown();
      if (response.data.data?.devOtp) {
        setDevOtp(response.data.data.devOtp);
      }
      toast.success('OTP sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');

    setIsLoading(true);
    try {
      const response = await verifyOtp(mobile, otp);
      const { accessToken, user } = response.data.data;
      setAuth(user, accessToken);
      navigate('/patient/home');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Patient Login</h1>
        <p className="text-gray-500 text-sm mt-1">Patients login using mobile OTP. No password required.</p>
      </div>

      {step === 'mobile' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="mobile">
              Mobile number
            </label>
            <input
              id="mobile"
              type="tel"
              autoFocus
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              placeholder="9876543210"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">OTP sent to</p>
              <p className="text-sm font-semibold text-blue-900">{mobile}</p>
            </div>
            <button type="button" onClick={() => setStep('mobile')} className="text-xs text-blue-500 hover:text-blue-700 underline">
              Change
            </button>
          </div>

          {devOtp ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-600 font-medium">Dev OTP</p>
              <p className="text-2xl font-bold text-amber-800 tracking-widest mt-0.5">{devOtp}</p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="otp">
              Enter 6-digit OTP
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-3xl font-bold tracking-[0.4em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-400">Resend in {countdown}s</p>
            ) : (
              <button type="button" onClick={handleSendOtp} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Resend OTP
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
        <p className="text-sm text-gray-500">
          New to PulseMate?{' '}
          <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
            Create patient account
          </Link>
        </p>
        <p className="text-sm text-gray-500">
          Staff member?{' '}
          <Link to="/staff/login" className="text-primary-600 font-semibold hover:text-primary-700">
            Use staff login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
