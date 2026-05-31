import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginWithPassword, logout } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import { ROLE_HOME } from '../../components/ProtectedRoute';

const AdminLoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();
  const resetCredentials = location.state?.resetCredentials;
  const [form, setForm] = useState({
    identifier: resetCredentials?.email || 'sahilnaik1515@gmail.com',
    password: resetCredentials?.password || '',
    securityCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await loginWithPassword({
        identifier: form.identifier,
        password: form.password,
      });
      const { accessToken, user } = response.data.data;

      if (user.role !== 'SUPER_ADMIN') {
        await logout().catch(() => {});
        clearAuth();
        toast.error('This login is restricted to PulseMate administrators.');
        return;
      }

      setAuth(user, accessToken);
      navigate(ROLE_HOME[user.role] || '/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_45%,#020617_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-10 text-white shadow-2xl shadow-black/30 backdrop-blur lg:flex lg:flex-col">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 font-bold text-white">
              P
            </div>
            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">PulseMate Internal</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Secure access for platform administration
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              This environment is reserved for authorized PulseMate super administrators handling approvals, governance and platform-wide operations.
            </p>

            <div className="mt-10 space-y-4">
              {[
                'Restricted access with internal-only workflows',
                'Clinic and doctor verification oversight',
                'Security-first admin authentication experience',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl shadow-slate-950/25 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 font-bold text-white">
                  P
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-950">Admin Portal</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Restricted Access</p>
                </div>
              </div>

              <h2 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">Secure Login</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Restricted access for authorized PulseMate administrators.
              </p>
              {resetCredentials ? (
                <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Database reset complete. Sign back in with the recreated admin account.
                </p>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={form.identifier}
                  onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
                  placeholder="sahilnaik1515@gmail.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Security code</label>
                <input
                  type="text"
                  value={form.securityCode}
                  onChange={(event) => setForm((current) => ({ ...current, securityCode: event.target.value }))}
                  placeholder="Reserved for upcoming 2FA"
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-slate-500 placeholder-slate-400 outline-none"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This field is a placeholder for the next admin security step and is not required yet.
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="font-semibold text-slate-900 hover:text-slate-700">
                  Forgot Password?
                </Link>
                <Link to="/" className="text-slate-500 hover:text-slate-800">
                  Back to Main Website
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : 'Secure Login'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
