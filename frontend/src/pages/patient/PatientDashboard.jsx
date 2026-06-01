import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getMyAppointments, getPatientProfile } from '../../api/patient.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const calcCompletion = (user, p) => {
  const checks = [!!user?.name, !!p?.gender, !!(p?.dob || p?.age), !!(p?.city || p?.address), !!p?.emergencyContact];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [profilePct, setProfilePct]     = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [apptRes, profileRes] = await Promise.all([
          getMyAppointments({ limit: 5 }),
          getPatientProfile(),
        ]);
        setAppointments(apptRes.data.data || []);
        const u = profileRes.data.data.user;
        setProfilePct(calcCompletion(u, u?.patientProfile));
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    };
    fetchAll();
  }, []);

  const active   = appointments.filter((a) => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));
  const recent   = appointments.filter((a) =>  ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {firstName}</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your health today.</p>
        </div>

        {/* Profile completion banner */}
        {profilePct !== null && profilePct < 100 && (
          <Link to="/patient/profile" className="block mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Complete your profile</p>
                    <p className="text-xs text-amber-600">Required before booking an appointment</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-700">{profilePct}%</span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${profilePct}%` }} />
              </div>
            </div>
          </Link>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { to: '/patient/search',        label: 'Find a Doctor',  sub: 'Search by specialty', color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { to: '/patient/appointments',  label: 'Appointments',   sub: 'View & manage',        color: 'bg-green-50 text-green-600 border-green-100' },
            { to: '/patient/prescriptions', label: 'Prescriptions',  sub: 'Your medications',     color: 'bg-purple-50 text-purple-600 border-purple-100' },
            { to: '/patient/profile',       label: 'My Profile',     sub: 'Health details',       color: 'bg-orange-50 text-orange-600 border-orange-100' },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`relative border rounded-xl p-4 hover:shadow-sm transition-all bg-white group`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${a.color}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.sub}</p>
              {a.to === '/patient/profile' && profilePct !== null && profilePct < 100 && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Active appointments */}
        {active.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Active Appointments</h2>
            </div>
            <div className="space-y-3">
              {active.map((appt) => (
                <div key={appt.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 font-bold text-sm">
                          {appt.doctor?.user?.name?.charAt(0) || 'D'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{appt.doctor?.user?.name}</p>
                        <p className="text-xs text-gray-400">{appt.clinic?.name} · {appt.clinic?.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={appt.status} />
                      {appt.queueNumber && (
                        <p className="text-xs text-gray-400 mt-1">Queue #{appt.queueNumber}</p>
                      )}
                    </div>
                  </div>
                  {['IN_QUEUE', 'BOOKED', 'CHECKED_IN'].includes(appt.status) && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Est. wait: {appt.estimatedWaitMinutes ? `${appt.estimatedWaitMinutes} min` : '—'}
                      </span>
                      <Link
                        to={`/patient/queue/${appt.id}`}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        Track live →
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Appointments</h2>
            <Link to="/patient/appointments" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : appointments.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">No appointments yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Book your first appointment with a doctor</p>
              <Link to="/patient/search" className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors">
                Find a Doctor
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
              {appointments.map((appt) => (
                <Link key={appt.id} to={`/patient/appointments/${appt.id}`} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{appt.doctor?.user?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {appt.clinic?.name} · {new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
