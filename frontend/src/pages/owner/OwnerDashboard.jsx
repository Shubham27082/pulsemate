import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import AccountApprovalState from '../../components/ui/AccountApprovalState';
import { getMyClinics, getClinicRevenue } from '../../api/clinic.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const OwnerDashboard = () => {
  const { user } = useAuthStore();
  const [clinics, setClinics]       = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [period, setPeriod]         = useState('today');
  const [revenue, setRevenue]       = useState(null);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // Load clinics once
  useEffect(() => {
    if (user?.approvalStatus && user.approvalStatus !== 'VERIFIED') {
      setLoadingClinics(false);
      return;
    }
    getMyClinics()
      .then((res) => {
        const list = res.data.data.clinics || [];
        setClinics(list);
        if (list.length > 0) setSelectedClinic(list[0]);
      })
      .catch(() => toast.error('Failed to load clinics'))
      .finally(() => setLoadingClinics(false));
  }, [user?.approvalStatus]);

  // Load revenue whenever clinic or period changes
  useEffect(() => {
    if (user?.approvalStatus && user.approvalStatus !== 'VERIFIED') return;
    if (!selectedClinic) return;
    setLoadingRevenue(true);
    getClinicRevenue(selectedClinic.id, period)
      .then((res) => setRevenue(res.data.data))
      .catch(() => toast.error('Failed to load revenue'))
      .finally(() => setLoadingRevenue(false));
  }, [selectedClinic, period]);

  if (user?.approvalStatus && user.approvalStatus !== 'VERIFIED') {
    return (
      <DashboardLayout>
        <AccountApprovalState
          status={user.approvalStatus}
          roleLabel="Clinic owner"
          reason={user?.rejectionReason || user?.ownedClinics?.[0]?.rejectionReason}
          primaryAction={{ to: '/owner', label: 'Refresh status' }}
          secondaryAction={{ to: '/login/clinic', label: 'Back to clinic login' }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Clinic Dashboard</h1>
          <p className="text-text-muted mt-1">Welcome back, {user?.name}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { to: '/owner/clinic',        icon: '🏥', label: 'Manage Clinic',  color: 'bg-blue-50 text-blue-600' },
            { to: '/owner/doctors',       icon: '👨‍⚕️', label: 'Doctors',        color: 'bg-green-50 text-green-600' },
            { to: '/owner/receptionists', icon: '👩‍💼', label: 'Receptionists',  color: 'bg-purple-50 text-purple-600' },
            { to: '/owner/appointments',  icon: '📅', label: 'Appointments',   color: 'bg-orange-50 text-orange-600' },
            { to: '/owner/queue',         icon: '🔢', label: 'Queue Overview', color: 'bg-red-50 text-red-600' },
          ].map((a) => (
            <Link key={a.to} to={a.to} className="card-hover flex flex-col items-center gap-2 py-4 text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${a.color}`}>{a.icon}</div>
              <span className="text-sm font-medium text-text-primary">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* ── Revenue Section ─────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="section-title">💰 Revenue</h2>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Clinic selector */}
              {clinics.length > 1 && (
                <select
                  className="input text-sm py-1.5 max-w-[180px]"
                  value={selectedClinic?.id || ''}
                  onChange={(e) => setSelectedClinic(clinics.find((c) => c.id === e.target.value))}
                >
                  {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {/* Period tabs */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      period === p.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-text-muted hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingRevenue ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : revenue ? (
            <>
              {/* Top stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Total Revenue"
                  value={fmt(revenue.totalRevenue)}
                  icon="💰"
                  color="bg-green-50 text-green-700"
                  big
                />
                <StatCard
                  label="Cash Collected"
                  value={fmt(revenue.cashRevenue)}
                  icon="💵"
                  color="bg-blue-50 text-blue-700"
                />
                <StatCard
                  label="Online Payments"
                  value={fmt(revenue.onlineRevenue)}
                  icon="💳"
                  color="bg-purple-50 text-purple-700"
                />
                <StatCard
                  label="Transactions"
                  value={revenue.transactionCount}
                  icon="🧾"
                  color="bg-orange-50 text-orange-700"
                />
              </div>

              {/* Today's appointment stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard label="Today's Appointments" value={revenue.stats?.totalAppointments ?? 0} icon="📅" color="bg-gray-50 text-gray-700" />
                <StatCard label="Completed Today"      value={revenue.stats?.completedToday ?? 0}    icon="✅" color="bg-green-50 text-green-700" />
                <StatCard label="Pending Payments"     value={revenue.stats?.pendingPayments ?? 0}   icon="⏳" color="bg-yellow-50 text-yellow-700" />
              </div>

              {/* Revenue by doctor */}
              {revenue.revenueByDoctor?.length > 0 && (
                <div className="card mb-6">
                  <h3 className="font-semibold text-text-primary mb-4">Revenue by Doctor</h3>
                  <div className="space-y-3">
                    {revenue.revenueByDoctor.map(({ doctor, amount }) => {
                      const pct = revenue.totalRevenue > 0 ? Math.round((amount / revenue.totalRevenue) * 100) : 0;
                      return (
                        <div key={doctor}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-text-primary">{doctor}</span>
                            <span className="text-sm font-bold text-secondary-600">{fmt(amount)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent transactions */}
              {revenue.recentPayments?.length > 0 ? (
                <div className="card">
                  <h3 className="font-semibold text-text-primary mb-4">Recent Transactions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-text-muted text-xs uppercase tracking-wide">
                          <th className="pb-2 pr-4">Patient</th>
                          <th className="pb-2 pr-4">Doctor</th>
                          <th className="pb-2 pr-4">Method</th>
                          <th className="pb-2 pr-4">Amount</th>
                          <th className="pb-2">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {revenue.recentPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="py-2.5 pr-4 font-medium text-text-primary">{p.patient?.name || '—'}</td>
                            <td className="py-2.5 pr-4 text-text-muted">{p.appointment?.doctor?.user?.name || '—'}</td>
                            <td className="py-2.5 pr-4">
                              <span className={`badge text-xs ${p.method === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {p.method === 'CASH' ? '💵 Cash' : '💳 Online'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 font-bold text-secondary-600">{fmt(p.amount)}</td>
                            <td className="py-2.5 text-text-muted text-xs">
                              {p.paidAt ? new Date(p.paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-8 text-text-muted">
                  <p className="text-3xl mb-2">💸</p>
                  <p className="font-medium">No transactions {period === 'today' ? 'today' : `this ${period}`}</p>
                  <p className="text-sm mt-1">Revenue will appear here once patients pay</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ── My Clinics ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Clinics</h2>
            <Link to="/owner/clinic" className="btn-primary text-sm py-2">+ New Clinic</Link>
          </div>

          {loadingClinics ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : clinics.length === 0 ? (
            <EmptyState
              icon="🏥"
              title="No clinics yet"
              description="Create your first clinic to get started"
              action={<Link to="/owner/clinic" className="btn-primary">Create Clinic</Link>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinics.map((clinic) => (
                <Link key={clinic.id} to={`/owner/clinic/${clinic.id}`} className="card-hover block">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary">{clinic.name}</h3>
                      <p className="text-sm text-text-muted mt-0.5">📍 {clinic.city}</p>
                      <p className="text-sm text-text-muted">🕐 {clinic.openingTime} - {clinic.closingTime}</p>
                    </div>
                    <span className={`badge ${clinic.isVerified ? 'badge-success' : 'badge-warning'}`}>
                      {clinic.isVerified ? '✓ Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex gap-4 text-sm text-text-muted">
                    <span>👥 {clinic._count?.staff || 0} staff</span>
                    <span>📅 {clinic._count?.appointments || 0} appointments</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon, color, big }) => (
  <div className={`card text-center ${big ? 'col-span-2 sm:col-span-1' : ''}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-2 ${color}`}>
      {icon}
    </div>
    <p className={`font-bold ${big ? 'text-2xl' : 'text-xl'} text-text-primary`}>{value}</p>
    <p className="text-xs text-text-muted mt-1">{label}</p>
  </div>
);

export default OwnerDashboard;
