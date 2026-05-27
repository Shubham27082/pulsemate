import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { sendOtp, verifyOtp } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';

const RegisterPage = () => {
  const [step, setStep]     = useState('details');
  const [form, setForm]     = useState({ name: '', mobile: '' });
  const [otp, setOtp]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  const startCountdown = () => {
    setCountdown(30);
    const t = setInterval(() => {
      setCountdown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!form.name.trim())   return toast.error('Enter your name');
    if (!form.mobile.trim()) return toast.error('Enter your mobile number');
    setIsLoading(true);
    try {
      const res = await sendOtp(form.mobile, 'SIGNUP');
      setStep('otp');
      startCountdown();
      if (res.data.data?.devOtp) setDevOtp(res.data.data.devOtp);
      toast.success('OTP sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setIsLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setIsLoading(true);
    try {
      const res = await verifyOtp(form.mobile, otp, 'SIGNUP', form.name);
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      toast.success('Account created!');
      navigate('/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally { setIsLoading(false); }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create account</h1>
        <p className="text-gray-500 text-sm mt-1">Join PulseMate as a patient — it's free.</p>
      </div>

      {step === 'details' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">Full name</label>
            <input
              id="name" type="text" autoFocus required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
              placeholder="Rahul Kumar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="mobile">Mobile number</label>
            <input
              id="mobile" type="tel" required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
              placeholder="+91 98765 43210"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </div>
          <button
            type="submit" disabled={isLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : 'Continue'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">OTP sent to</p>
              <p className="text-sm font-semibold text-blue-900">{form.mobile}</p>
            </div>
            <button type="button" onClick={() => setStep('details')} className="text-xs text-blue-500 hover:text-blue-700 underline">
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="otp">Enter 6-digit OTP</label>
            <input
              id="otp" type="text" inputMode="numeric" autoFocus maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-3xl font-bold tracking-[0.5em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
              placeholder="——————"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          <button
            type="submit" disabled={isLoading || otp.length !== 6}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : 'Create account'}
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

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Applying as a doctor or clinic owner?{' '}
          <Link to="/register/doctor" className="font-semibold text-green-600 hover:text-green-700">Doctor</Link>
          {' '}or{' '}
          <Link to="/register/clinic-owner" className="font-semibold text-orange-600 hover:text-orange-700">Clinic Owner</Link>
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

export default RegisterPage;
