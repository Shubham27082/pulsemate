import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginWithPassword } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import { ROLE_HOME } from '../../components/ProtectedRoute';
import StaffPortalLayout from '../../layouts/StaffPortalLayout';

const quickPoints = [
  'Role-based clinic access',
  'Live queue and schedule control',
  'Secure cloud-first operations',
];

const statusCards = [
  { value: '32', label: 'Appointments today', tone: 'blue' },
  { value: '18', label: 'Live queue', tone: 'emerald' },
  { value: '24', label: 'Completed', tone: 'violet' },
];

const roleCards = [
  { title: 'Clinic Owner', body: 'Manage staff, bookings and clinic operations.', icon: 'building' },
  { title: 'Doctor', body: 'Track schedule, queue and consultation flow.', icon: 'doctor' },
  { title: 'Receptionist', body: 'Handle check-ins, bookings and live queue updates.', icon: 'queue' },
];

const trustStrip = [
  { title: 'Trusted by 5000+ Clinics', body: 'Used by growing clinic teams across India.', icon: 'shield' },
  { title: '256-bit Encryption', body: 'Protected with bank-level security.', icon: 'lock' },
  { title: 'Cloud Based', body: 'Secure access from front desk to consultation room.', icon: 'cloud' },
  { title: '24/7 Support', body: 'Fast help whenever your staff needs it.', icon: 'support' },
  { title: 'Regular Updates', body: 'Continuous improvements for daily operations.', icon: 'users' },
];

const iconPaths = {
  building: 'M8 21h8M10 21V7.5A1.5 1.5 0 0 1 11.5 6h5A1.5 1.5 0 0 1 18 7.5V21M6 21V10.5A1.5 1.5 0 0 1 7.5 9H10M13 10h2m-2 3h2m-2 3h2',
  doctor: 'M9 4v5a3 3 0 0 0 6 0V4m-6 3H7m8 0h2m-5 8a4 4 0 1 0 8 0v-1a2 2 0 1 0-2-2',
  queue: 'M8.5 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM3.5 19a5 5 0 0 1 10 0m1 0a5 5 0 0 1 6 0',
  mail: 'M4 7.5 12 13l8-5.5M5.5 5h13A1.5 1.5 0 0 1 20 6.5v11A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11A1.5 1.5 0 0 1 5.5 5Z',
  lock: 'M7.5 11V8a4.5 4.5 0 1 1 9 0v3M6.5 11h11A1.5 1.5 0 0 1 19 12.5v6A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11Z',
  eye: 'M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  arrow: 'M15 6.5 9.5 12 15 17.5M10.5 12H21',
  shield: 'M12 3.5 19 6v5.5c0 4.3-2.7 7.2-7 9-4.3-1.8-7-4.7-7-9V6l7-2.5Z',
  info: 'M12 16.5v-5m0-3h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z',
  cloud: 'M7.5 18.5h9a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.7-1.4A3.5 3.5 0 0 0 7.5 18.5Z',
  support: 'M8 13.5V12a4 4 0 1 1 8 0v1.5m-8 0a2 2 0 0 0-2 2V17a2 2 0 0 0 2 2h1.5l1.8 1.8a1 1 0 0 0 1.4 0L14.5 19H16a2 2 0 0 0 2-2v-1.5a2 2 0 0 0-2-2m-8 0h8',
  users: 'M7.5 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm9 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM2.5 19a5 5 0 0 1 10 0m1.5 0a5 5 0 0 1 7 0',
};

const toneClasses = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
};

const Icon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={iconPaths[name]} />
  </svg>
);

const BrandLogo = ({ dark = false }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-300 to-blue-500 text-white shadow-[0_16px_40px_rgba(37,99,235,0.22)]">
      <svg viewBox="0 0 64 64" fill="none" className="h-8 w-8">
        <path d="M31.8 53.5 11.2 33.3a11 11 0 0 1 15.6-15.5l5 4.8 5-4.8a11 11 0 0 1 15.6 15.5L31.8 53.5Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="M17 31h10l4-8 5 16 3-8h8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="min-w-0">
      <p className={`truncate text-2xl font-bold tracking-tight ${dark ? 'text-slate-950' : 'text-white'}`}>PulseMate</p>
      <p className={`truncate text-base ${dark ? 'text-blue-600' : 'text-cyan-300'}`}>Clinic Staff Portal</p>
    </div>
  </div>
);

const StaffLoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await loginWithPassword(form);
      const { accessToken, user } = response.data.data;
      setAuth(user, accessToken);
      navigate(ROLE_HOME[user.role] || '/patient/home');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StaffPortalLayout>
            <div className="grid gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-start">
              <div className="min-w-0 animate-fade-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/90 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm">
                  <Icon name="shield" className="h-4 w-4" />
                  Staff access for verified clinic roles
                </div>

                <h1 className="mt-7 max-w-2xl text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl xl:text-[4.15rem]">
                  Sign in to run
                  <br />
                  your clinic day
                  <br />
                  with <span className="bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)] bg-clip-text text-transparent">clarity.</span>
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                  Access one secure workspace for bookings, queue flow, patient operations and day-to-day clinic coordination.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {statusCards.map((item) => (
                    <div key={item.label} className="rounded-[1.4rem] border border-white/80 bg-white/92 px-4 py-5 shadow-[0_12px_35px_rgba(125,162,196,0.1)]">
                      <p className="text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-9 rounded-[2rem] border border-white/90 bg-white/88 p-5 shadow-[0_18px_50px_rgba(125,162,196,0.12)] backdrop-blur sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Who signs in here</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Built for the people running care operations daily</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {roleCards.map((role) => (
                        <div key={role.title} className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-4 shadow-[0_10px_30px_rgba(125,162,196,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(125,162,196,0.14)]">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                            <Icon name={role.icon} className="h-5 w-5" />
                          </div>
                          <h3 className="mt-4 text-lg font-semibold text-slate-900">{role.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{role.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 animate-fade-up" style={{ animationDelay: '0.08s' }}>
                <div className="mx-auto w-full max-w-xl rounded-[2.2rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,249,255,0.93))] p-6 shadow-[0_28px_80px_rgba(125,162,196,0.16)] backdrop-blur xl:p-8">
                  <div className="mb-6 lg:hidden">
                    <BrandLogo dark />
                  </div>

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8_0%,#3b82f6_100%)] text-white shadow-[0_18px_45px_rgba(37,99,235,0.28)]">
                    <Icon name="shield" className="h-8 w-8" />
                  </div>

                  <div className="mt-5 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Unified Staff Access</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome back to the portal</h2>
                    <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
                      Use your registered email or phone number with your password to continue securely.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Unified access for clinic owners, doctors and receptionists
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Email or phone</label>
                      <div className="relative">
                        <input
                          type="text"
                          autoFocus
                          required
                          value={form.identifier}
                          onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
                          placeholder="doctor@example.com or 9876543210"
                          className="w-full rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3 pr-12 text-base text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:px-5 sm:py-4 sm:pr-14 sm:text-lg"
                        />
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon name="mail" className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Password</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon name="lock" className="h-5 w-5" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={form.password}
                          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                          placeholder="Enter your password"
                          className="w-full rounded-[1.15rem] border border-slate-200 bg-white py-3 pl-11 pr-12 text-base text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:py-4 sm:pl-12 sm:pr-14 sm:text-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                        >
                          <Icon name="eye" className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700">
                        Forgot password?
                      </Link>
                      <Link to="/portal" className="text-slate-500 hover:text-slate-800">
                        Back to portal landing
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex w-full items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_18px_45px_rgba(79,70,229,0.22)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:opacity-50 sm:py-4 sm:text-lg"
                    >
                      {isLoading ? 'Signing in...' : 'Login to Portal'}
                    </button>
                  </form>

                  <div className="mt-7 rounded-[1.4rem] border border-blue-100 bg-[linear-gradient(180deg,#f5f8ff_0%,#eef4ff_100%)] p-4 text-blue-700 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                        <Icon name="info" className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium leading-6 sm:text-base">
                        Clinic owners, doctors and receptionists all sign in here with their registered credentials.
                        <span className="block pt-1 text-blue-600/90">
                          Patients do not log in here. Patient access continues through the OTP flow on the public website.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section id="support" className="mt-8 rounded-[1.9rem] bg-[linear-gradient(135deg,#0d1e6c_0%,#122f89_50%,#184bb4_100%)] px-5 py-6 text-white shadow-[0_26px_64px_rgba(26,66,159,0.34)] sm:px-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {trustStrip.map((item, index) => (
                  <div key={item.title} className={`flex items-center gap-4 ${index < trustStrip.length - 1 ? 'xl:border-r xl:border-white/15' : ''} xl:pr-5`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                      <Icon name={item.icon} className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-blue-100">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
    </StaffPortalLayout>
  );
};

export default StaffLoginPage;
