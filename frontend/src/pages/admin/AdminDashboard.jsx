import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { getAdminDashboard, resetDatabase as resetDatabaseRequest } from '../../api/admin.api';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [stats, setStats] = useState(null);
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
      navigate('/admin', {
        replace: true,
        state: {
          resetCredentials: recreatedAdmin,
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to reset the database');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="mt-1 text-text-muted">PulseMate platform overview and approval workload</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon="Users" color="blue" />
              <StatsCard title="Pending Clinics" value={stats?.pendingClinics || 0} icon="Clinics" color="yellow" />
              <StatsCard title="Pending Doctors" value={stats?.pendingDoctors || 0} icon="Doctors" color="yellow" />
              <StatsCard title="Verified Clinics" value={stats?.verifiedClinics || 0} icon="Verified" color="green" />
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatsCard title="Verified Doctors" value={stats?.verifiedDoctors || 0} icon="Ready" color="green" />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {canViewApprovals ? (
            <Link to="/admin/clinics" className="card-hover flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-sm font-semibold text-yellow-700">
                AP
              </div>
              <div>
                <p className="font-semibold text-text-primary">Approval Center</p>
                <p className="text-sm text-text-muted">Review clinic and doctor applications with approval reasons</p>
              </div>
            </Link>
          ) : null}
          <Link to="/admin/users" className="card-hover flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-700">
              UM
            </div>
            <div>
              <p className="font-semibold text-text-primary">User Management</p>
              <p className="text-sm text-text-muted">Inspect approval state, user status, and admin levels</p>
            </div>
          </Link>
        </div>

        {isRootAdmin ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50/70 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Root Only</p>
                <h2 className="mt-2 text-xl font-semibold text-red-950">Reset Database</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-red-900/80">
                  Delete all clinics, users, appointments, queue records, payments, sessions, and logs so you can retest
                  from a clean state.
                </p>
                <p className="mt-2 text-sm text-red-900/80">
                  Root admin recreated after reset: <span className="font-semibold">sahilnaik1515@gmail.com</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Reset Database
              </button>
            </div>
          </div>
        ) : null}

        {isRootAdmin ? (
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

              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
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
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  disabled={isResetting}
                  className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResetting ? 'Resetting...' : 'Delete Everything'}
                </button>
              </div>
            </div>
          </Modal>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
