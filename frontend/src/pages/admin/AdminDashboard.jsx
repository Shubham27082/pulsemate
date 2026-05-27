import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAdminDashboard } from '../../api/admin.api';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="mt-1 text-text-muted">PulseMate platform overview and approval workload</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="blue" />
              <StatsCard title="Total Clinics" value={stats?.totalClinics || 0} icon="🏥" color="green" />
              <StatsCard title="Pending Clinics" value={stats?.pendingClinics || 0} icon="⏳" color="yellow" />
              <StatsCard title="Pending Doctors" value={stats?.pendingDoctors || 0} icon="🩺" color="yellow" />
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatsCard title="Doctors" value={stats?.totalDoctors || 0} icon="👨‍⚕️" color="blue" />
              <StatsCard title="Patients" value={stats?.totalPatients || 0} icon="🧑" color="green" />
              <StatsCard title="Verified Clinics" value={stats?.verifiedClinics || 0} icon="✅" color="green" />
              <StatsCard title="Today's Appointments" value={stats?.todayAppointments || 0} icon="📅" color="purple" />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link to="/admin/clinics" className="card-hover flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-2xl">⏳</div>
            <div>
              <p className="font-semibold text-text-primary">Approval Center</p>
              <p className="text-sm text-text-muted">Review clinic and doctor applications with approval reasons</p>
            </div>
          </Link>
          <Link to="/admin/users" className="card-hover flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">👥</div>
            <div>
              <p className="font-semibold text-text-primary">User Management</p>
              <p className="text-sm text-text-muted">Inspect approval state, user status, and admin levels</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
