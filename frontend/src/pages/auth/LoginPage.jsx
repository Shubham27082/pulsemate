import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { sendOtp, verifyOtp, loginWithPassword } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';

const STEPS = { MOBILE: 'mobile', OTP: 'otp' };

const LoginPage = () => {
  const [step, setStep]           = useState(STEPS.MOBILE);
  const [mobile, setMobile]       = useState('');
  const [otp, setOtp]             = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp]       = useState('');
  const [loginMode, setLoginMode] = useState('otp');

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  const startCountdown = (secs = 30) => {
    setCountdown(secs);
    const t = setInterval(() => {
      setCountdown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!mobile.trim()) return toast.error('Enter your mobile number');
    setIsLoading(true);
    try {
      const res = await sendOtp(mobile, 'LOGIN');
      setStep(STEPS.OTP);
      startCountdown();
      if (res.data.data?.devOtp) {
        setDevOtp(res.data.data.devOtp);
      }
      toast.success('OTP sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setIsLoading(true);
    try {
      const res = await verifyOtp(mobile, otp, 'LOGIN');
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      navigate(roleHome(user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await loginWithPassword({ mobile, password });
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      navigate(roleHome(user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const roleHome = (role) => ({
    SUPER_ADMIN: '/admin', CLINIC_OWNER: '/owner',
    DOCTOR: '/doctor', RECEPTIONIST: '/reception', PATIENT: '/patient',
  }[role] || '/patient');

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in</h1>
        <p className="text-gray-500 text-sm mt-1">
          {loginMode === 'otp' ? 'We\'ll send a one-time code to your phone.' : 'Use your mobile number and password.'}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {[['otp', 'Mobile OTP'], ['password', 'Password']].map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => { setLoginMode(mode); setStep(STEPS.MOBILE); setOtp(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginMode === mode
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* OTP flow */}
      {loginMode === 'otp' && step === STEPS.MOBILE && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="mobile">
              Mobile number
            </label>
            <input
              id="mobile" type="tel" autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
              placeholder="+91 98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : 'Send OTP'}
          </button>
        </form>
      )}

      {loginMode === 'otp' && step === STEPS.OTP && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">OTP sent to</p>
              <p className="text-sm font-semibold text-blue-900">{mobile}</p>
            </div>
            <button type="button" onClick={() => setStep(STEPS.MOBILE)} className="text-xs text-blue-500 hover:text-blue-700 underline">
              Change
            </button>
          </div>

          {devOtp && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-600 font-medium">Dev mode — your OTP is</p>
              <p className="text-2xl font-bold text-amber-800 tracking-widest mt-0.5">{devOtp}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="otp">
              Enter 6-digit OTP
            </label>
            <input
              id="otp" type="text" inputMode="numeric" autoFocus maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-3xl font-bold tracking-[0.5em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
              placeholder="——————"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : 'Verify & Sign in'}
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

      {/* Password flow */}
      {loginMode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="mpwd">
              Mobile number
            </label>
            <input
              id="mpwd" type="tel"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
              placeholder="+91 98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="pwd">
              Password
            </label>
            <div className="relative">
              <input
                id="pwd"
                type={showPwd ? 'text' : 'password'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white pr-12"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : 'Sign in'}
          </button>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          New to PulseMate?{' '}
          <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

const Spinner = () => (
  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default LoginPage;
