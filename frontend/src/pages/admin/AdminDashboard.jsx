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
      } catch (err) {
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
          <p className="text-text-muted mt-1">PulseMate Platform Overview</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="blue" />
              <StatsCard title="Total Clinics" value={stats?.totalClinics || 0} icon="🏥" color="green" />
              <StatsCard title="Pending Approval" value={stats?.pendingClinics || 0} icon="⏳" color="yellow" />
              <StatsCard title="Today's Appointments" value={stats?.todayAppointments || 0} icon="📅" color="purple" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <StatsCard title="Doctors" value={stats?.totalDoctors || 0} icon="👨‍⚕️" color="blue" />
              <StatsCard title="Patients" value={stats?.totalPatients || 0} icon="🤒" color="green" />
              <StatsCard title="Verified Clinics" value={stats?.verifiedClinics || 0} icon="✅" color="green" />
              <StatsCard title="Total Appointments" value={stats?.totalAppointments || 0} icon="📋" color="purple" />
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/admin/clinics" className="card-hover flex items-center gap-4 p-5">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="font-semibold text-text-primary">Clinic Approvals</p>
              <p className="text-sm text-text-muted">Review and approve clinic registrations</p>
            </div>
          </Link>
          <Link to="/admin/users" className="card-hover flex items-center gap-4 p-5">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <div>
              <p className="font-semibold text-text-primary">User Management</p>
              <p className="text-sm text-text-muted">Manage all platform users</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
