import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getMe } from '../../api/auth.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ReceptionDashboard = () => {
  const { user } = useAuthStore();
  const [clinics, setClinics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For receptionist, fetch their clinic info from user's clinicStaff
    const fetchData = async () => {
      try {
        const res = await getMe();
        const staffClinics = res.data.data.user?.clinicStaff || [];
        setClinics(staffClinics.map((s) => s.clinic));
      } catch (err) {
        console.error('Failed to fetch clinic data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Reception Dashboard</h1>
          <p className="text-text-muted mt-1">Welcome, {user?.name}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link to="/reception/queue" className="card-hover flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-3xl">🔢</div>
            <div>
              <p className="font-semibold text-text-primary">Today's Queue</p>
              <p className="text-sm text-text-muted">Manage patient queue</p>
            </div>
          </Link>
          <Link to="/reception/walk-in" className="card-hover flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-3xl">🚶</div>
            <div>
              <p className="font-semibold text-text-primary">Walk-in Patient</p>
              <p className="text-sm text-text-muted">Add to queue directly</p>
            </div>
          </Link>
        </div>

        {/* Clinic Info */}
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : clinics.length > 0 && (
          <div>
            <h2 className="section-title mb-4">My Clinic</h2>
            {clinics.map((clinic) => clinic && (
              <div key={clinic.id} className="card">
                <h3 className="font-semibold text-text-primary text-lg">{clinic.name}</h3>
                <p className="text-text-muted text-sm mt-1">📍 {clinic.city}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
