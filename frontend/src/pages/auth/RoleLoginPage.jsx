import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sendOtp, verifyOtp, loginWithPassword } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  patient: {
    label: 'Patient',
    desc: 'Sign in to book appointments and track your queue',
    color: 'bg-blue-600',
    lightColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    ringColor: 'focus:ring-blue-500',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
    loginType: 'otp',   // patients use OTP
    showRegister: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    features: ['Book appointments instantly', 'Live queue tracking', 'Digital prescriptions'],
  },
  doctor: {
    label: 'Doctor',
    desc: 'Access your consultation dashboard and patient queue',
    color: 'bg-green-600',
    lightColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-600',
    ringColor: 'focus:ring-green-500',
    btnColor: 'bg-green-600 hover:bg-green-700',
    loginType: 'password',
    showRegister: false,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    features: ['View today\'s appointments', 'Manage patient queue', 'Write prescriptions'],
  },
  receptionist: {
    label: 'Receptionist',
    desc: 'Manage walk-ins, check-ins and daily queue operations',
    color: 'bg-purple-600',
    lightColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    ringColor: 'focus:ring-purple-500',
    btnColor: 'bg-purple-600 hover:bg-purple-700',
    loginType: 'password',
    showRegister: false,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    features: ['Add walk-in patients', 'Call next in queue', 'Handle follow-ups'],
  },
  clinic: {
    label: 'Clinic Owner',
    desc: 'Manage your clinic, staff and appointment analytics',
    color: 'bg-orange-600',
    lightColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
    ringColor: 'focus:ring-orange-500',
    btnColor: 'bg-orange-600 hover:bg-orange-700',
    loginType: 'password',
    showRegister: false,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    features: ['Manage doctors & staff', 'View clinic analytics', 'Monitor all queues'],
  },
  admin: {
    label: 'Super Admin',
    desc: 'Platform administration, clinic approvals and user management',
    color: 'bg-red-600',
    lightColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    ringColor: 'focus:ring-red-500',
    btnColor: 'bg-red-600 hover:bg-red-700',
    loginType: 'password',
    showRegister: false,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    features: ['Approve clinic registrations', 'Manage all users', 'Platform analytics'],
  },
};

const ROLE_HOME = {
  SUPER_ADMIN: '/admin', CLINIC_OWNER: '/owner',
  DOCTOR: '/doctor', RECEPTIONIST: '/reception', PATIENT: '/patient',
};

// ─── Component ────────────────────────────────────────────────────────────────
const RoleLoginPage = () => {
  const { role } = useParams();
  const navigate  = useNavigate();
  const { setAuth } = useAuthStore();

  const config = ROLE_CONFIG[role];

  // Redirect to role selector if invalid role
  if (!config) {
    navigate('/login');
    return null;
  }

  const [step, setStep]         = useState('form'); // 'form' | 'otp'
  const [mobile, setMobile]     = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp]     = useState('');

  const startCountdown = () => {
    setCountdown(30);
    const t = setInterval(() => {
      setCountdown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
  };

  // OTP flow (patients)
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!mobile.trim()) return toast.error('Enter your mobile number');
    setIsLoading(true);
    try {
      const res = await sendOtp(mobile, 'LOGIN');
      setStep('otp');
      startCountdown();
      if (res.data.data?.devOtp) setDevOtp(res.data.data.devOtp);
      toast.success('OTP sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setIsLoading(true);
    try {
      const res = await verifyOtp(mobile, otp, 'LOGIN');
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      navigate(ROLE_HOME[user.role] || '/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setIsLoading(false); }
  };

  // Password flow (staff)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await loginWithPassword({ mobile, password });
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      navigate(ROLE_HOME[user.role] || '/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setIsLoading(false); }
  };

  const inputClass = `w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white transition focus:outline-none focus:ring-2 ${config.ringColor} focus:border-transparent`;

  return (
    <div className="min-h-screen flex">
      {/* Left — role branding panel */}
      <div className={`hidden lg:flex lg:w-5/12 ${config.color} flex-col justify-between p-12 relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <button onClick={() => navigate('/login')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">PulseMate</span>
          </button>
        </div>

        {/* Role info */}
        <div className="relative z-10">
          {/* Role badge */}
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-4 py-2 mb-6">
            <span className="text-white">{config.icon}</span>
            <span className="text-white font-semibold text-sm">{config.label} Portal</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            {config.label}<br />Dashboard
          </h2>
          <p className="text-white text-opacity-80 text-base leading-relaxed mb-10 opacity-90">
            {config.desc}
          </p>

          {/* Features */}
          <div className="space-y-3">
            {config.features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white bg-opacity-30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white text-sm opacity-90">{f}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white text-xs opacity-50">© {new Date().getFullYear()} PulseMate Health Technologies</p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-gray-50">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <button onClick={() => navigate('/login')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">PulseMate</span>
          </button>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.lightColor} ${config.textColor} border ${config.borderColor}`}>
            {config.label}
          </span>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Back link */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All portals
          </button>

          {/* Role badge — desktop */}
          <div className={`hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.lightColor} ${config.textColor} border ${config.borderColor} mb-5`}>
            {config.icon}
            <span className="text-sm font-semibold">{config.label} Portal</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in</h1>
            <p className="text-gray-500 text-sm mt-1">
              {config.loginType === 'otp'
                ? "We'll send a one-time code to your phone."
                : 'Use your registered mobile number and password.'}
            </p>
          </div>

          {/* ── OTP flow (Patient) ── */}
          {config.loginType === 'otp' && step === 'form' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
                <input
                  type="tel" autoFocus required
                  className={inputClass}
                  placeholder="+91 98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              <button type="submit" disabled={isLoading}
                className={`w-full py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${config.btnColor}`}>
                {isLoading ? <Spinner /> : 'Send OTP'}
              </button>
            </form>
          )}

          {config.loginType === 'otp' && step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">OTP sent to</p>
                  <p className="text-sm font-semibold text-blue-900">{mobile}</p>
                </div>
                <button type="button" onClick={() => setStep('form')} className="text-xs text-blue-500 hover:text-blue-700 underline">
                  Change
                </button>
              </div>

              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-600 font-medium">Dev mode — your OTP</p>
                  <p className="text-2xl font-bold text-amber-800 tracking-widest mt-0.5">{devOtp}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter 6-digit OTP</label>
                <input
                  type="text" inputMode="numeric" autoFocus maxLength={6}
                  className={`${inputClass} text-center text-3xl font-bold tracking-[0.5em]`}
                  placeholder="——————"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              <button type="submit" disabled={isLoading || otp.length !== 6}
                className={`w-full py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${config.btnColor}`}>
                {isLoading ? <Spinner /> : 'Verify & Sign in'}
              </button>

              <div className="text-center">
                {countdown > 0
                  ? <p className="text-sm text-gray-400">Resend in {countdown}s</p>
                  : <button type="button" onClick={handleSendOtp} className={`text-sm font-medium ${config.textColor}`}>Resend OTP</button>
                }
              </div>
            </form>
          )}

          {/* ── Password flow (Staff) ── */}
          {config.loginType === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
                <input
                  type="tel" autoFocus required
                  className={inputClass}
                  placeholder="+91 98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} required
                    className={`${inputClass} pr-12`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd
                      ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className={`w-full py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${config.btnColor}`}>
                {isLoading ? <Spinner /> : 'Sign in'}
              </button>
            </form>
          )}

          {/* Register link — patients only */}
          {config.showRegister && (
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                New to PulseMate?{' '}
                <Link to="/register" className={`font-semibold ${config.textColor}`}>Create account</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Spinner = () => (
  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default RoleLoginPage;
