import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { getAdminDashboard, resetDatabase as resetDatabaseRequest } from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';

// ── Stat card icons (inline SVG for crispness) ────────────────────────────────
const StatIcon = {
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 10-8 0 4 4 0 008 0zM21 8a4 4 0 10-8 0 4 4 0 008 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Ban: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  Doctor: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Stethoscope: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h6a2 2 0 002-2v-5M9 21H5a2 2 0 01-2-2v-5m0 0h18" />
    </svg>
  ),
  Gift: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a4 4 0 00-4-4H7a3 3 0 000 6h5m0-6a4 4 0 014-4h1a3 3 0 010 6h-5m-7 4h14a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1v-7a1 1 0 011-1z" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Currency: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 6m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ── Reusable premium stat card ────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, colorScheme, loading }) => {
  const schemes = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   accent: 'bg-blue-600'   },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  accent: 'bg-green-500'  },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', accent: 'bg-yellow-500' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    accent: 'bg-red-500'    },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', accent: 'bg-orange-500' },
    gray:   { bg: 'bg-gray-100',  icon: 'text-gray-500',   accent: 'bg-gray-400'   },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', accent: 'bg-indigo-500' },
    teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600',   accent: 'bg-teal-500'   },
    emerald:{ bg: 'bg-emerald-50',icon: 'text-emerald-600',accent: 'bg-emerald-500'},
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', accent: 'bg-violet-500' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  accent: 'bg-amber-500'  },
    cyan:   { bg: 'bg-cyan-50',   icon: 'text-cyan-600',   accent: 'bg-cyan-500'   },
  };
  const s = schemes[colorScheme] || schemes.blue;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg}`}>
          <span className={s.icon}>
            <Icon />
          </span>
        </div>
        <span className={`w-2 h-2 rounded-full ${s.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
      </div>
      {loading ? (
        <div>
          <div className="h-8 w-16 rounded-lg bg-gray-100 animate-pulse mb-2" />
          <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-3xl font-bold text-gray-900 leading-none mb-1.5">{value ?? 0}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        </div>
      )}
    </div>
  );
};

// ── Quick action card ─────────────────────────────────────────────────────────
const ActionCard = ({ to, icon, iconBg, iconColor, title, description }) => (
  <Link
    to={to}
    className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm
               hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5
               transition-all duration-200 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <span className={`text-xl ${iconColor}`}>{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 text-sm leading-tight">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
    </div>
    <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-gray-50 group-hover:bg-blue-50 transition-colors">
      <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </Link>
);

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [stats, setStats] = useState(null);
  const [bookingMetrics, setBookingMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isRootAdmin = currentUser?.adminLevel === 'ROOT';
  const canViewApprovals = ['ROOT', 'SUPER_ADMIN', 'SUPPORT'].includes(currentUser?.adminLevel);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminDashboard();
        setStats(res.data.data.stats);
        setBookingMetrics(res.data.data.bookingMetrics ?? null);
      } catch (_) {
        console.error('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const response = await resetDatabaseRequest();
      const recreatedAdmin = response.data?.data?.admin;
      toast.success('Database cleared. Sign in again with the recreated admin account.');
      setIsResetModalOpen(false);
      await logout();
      navigate('/admin', { replace: true, state: { resetCredentials: recreatedAdmin } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to reset the database');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                PulseMate platform overview and approval workload
              </p>
            </div>
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-semibold text-green-700">Live</span>
            </div>
          </div>
        </div>

        {/* ── Clinic stats row ─────────────────────────────────────────── */}
        <div className="mb-3">
          <SectionLabel>Clinic Overview</SectionLabel>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers}
            icon={StatIcon.Users}
            colorScheme="blue"
            loading={isLoading}
          />
          <StatCard
            label="Pending Clinics"
            value={stats?.pendingClinics}
            icon={StatIcon.Clock}
            colorScheme="yellow"
            loading={isLoading}
          />
          <StatCard
            label="Approved Clinics"
            value={stats?.verifiedClinics}
            icon={StatIcon.Check}
            colorScheme="green"
            loading={isLoading}
          />
          <StatCard
            label="Rejected Clinics"
            value={stats?.rejectedClinics}
            icon={StatIcon.X}
            colorScheme="red"
            loading={isLoading}
          />
        </div>

        {/* ── Clinic status row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Changes Required"
            value={stats?.changesRequiredClinics}
            icon={StatIcon.Edit}
            colorScheme="orange"
            loading={isLoading}
          />
          <StatCard
            label="Suspended Clinics"
            value={stats?.suspendedClinics}
            icon={StatIcon.Ban}
            colorScheme="gray"
            loading={isLoading}
          />
          <StatCard
            label="Pending Doctors"
            value={stats?.pendingDoctors}
            icon={StatIcon.Doctor}
            colorScheme="indigo"
            loading={isLoading}
          />
          <StatCard
            label="Verified Doctors"
            value={stats?.verifiedDoctors}
            icon={StatIcon.Stethoscope}
            colorScheme="teal"
            loading={isLoading}
          />
        </div>

        {/* ── Booking Metrics ──────────────────────────────────────────── */}
        <div className="mb-3">
          <SectionLabel>Booking Metrics</SectionLabel>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Free Bookings"
            value={bookingMetrics?.freeBookings}
            icon={StatIcon.Gift}
            colorScheme="emerald"
            loading={isLoading}
          />
          <StatCard
            label="Paid Bookings"
            value={bookingMetrics?.paidBookings}
            icon={StatIcon.CreditCard}
            colorScheme="violet"
            loading={isLoading}
          />
          <StatCard
            label="Conversion Rate"
            value={bookingMetrics ? `${bookingMetrics.conversionRate}%` : undefined}
            icon={StatIcon.TrendingUp}
            colorScheme="amber"
            loading={isLoading}
          />
          <StatCard
            label="Total Revenue"
            value={bookingMetrics ? `₹${bookingMetrics.totalRevenue}` : undefined}
            icon={StatIcon.Currency}
            colorScheme="cyan"
            loading={isLoading}
          />
        </div>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <div className="mb-3">
          <SectionLabel>Quick Actions</SectionLabel>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {canViewApprovals && (
            <ActionCard
              to="/admin/clinics/verify"
              icon="🏥"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              title="Clinic Verification"
              description="Review, approve, reject, and manage clinic applications"
            />
          )}
          <ActionCard
            to="/admin/users"
            icon="👤"
            iconBg="bg-green-50"
            iconColor="text-green-600"
            title="User Management"
            description="Inspect approval state, user status, and admin levels"
          />
          {canViewApprovals && (
            <ActionCard
              to="/admin/notifications"
              icon="🔔"
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              title="Notifications & Updates"
              description="Create, send, pause, and stop user notification campaigns"
            />
          )}
        </div>

        {/* ── Root Only: Reset Database ─────────────────────────────────── */}
        {isRootAdmin && (
          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                {/* Warning icon */}
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-red-500">Root Admin Only</span>
                  </div>
                  <h2 className="text-base font-bold text-red-900">Reset Database</h2>
                  <p className="mt-1 text-sm text-red-700/80 leading-relaxed max-w-xl">
                    Permanently deletes all clinics, users, appointments, queues, payments, sessions, and logs.
                    A fresh root admin is recreated after reset.
                  </p>
                  <p className="mt-2 text-xs text-red-600 font-medium">
                    Recreated admin: <span className="font-bold">sahilnaik1515@gmail.com</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="inline-flex items-center gap-2 justify-center rounded-xl bg-red-600 px-5 py-2.5
                           text-sm font-semibold text-white transition-all hover:bg-red-700 shadow-sm
                           whitespace-nowrap flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset Database
              </button>
            </div>
          </div>
        )}

        {/* ── Reset Modal ───────────────────────────────────────────────── */}
        {isRootAdmin && (
          <Modal
            isOpen={isResetModalOpen}
            onClose={() => !isResetting && setIsResetModalOpen(false)}
            title="Reset database"
            size="md"
          >
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                This permanently clears the current database contents and keeps only a fresh root admin login for
                testing.
              </p>

              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <p>
                  Email: <span className="font-semibold text-slate-900">sahilnaik1515@gmail.com</span>
                </p>
                <p className="mt-1">
                  Password: <span className="font-semibold text-slate-900">Nkabu18$</span>
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700
                             transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  disabled={isResetting}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white
                             transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResetting ? 'Resetting…' : 'Delete Everything'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
