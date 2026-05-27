import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import AccountApprovalState from '../../components/ui/AccountApprovalState';
import {
  getTodayAppointments,
  getDoctorAppointments,
  updateAvailability,
  startConsultation,
  completeConsultation,
} from '../../api/doctor.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const [todayAppts, setTodayAppts]       = useState([]);
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [availability, setAvailability]   = useState({ online: false, offline: true });
  const [togglingAvail, setTogglingAvail] = useState(false);

  const fetchAll = async () => {
    try {
      const [todayRes, allRes] = await Promise.all([
        getTodayAppointments(),
        getDoctorAppointments({ status: 'BOOKED' }),
      ]);

      const today = todayRes.data.data.appointments || [];
      setTodayAppts(today);

      // Upcoming = BOOKED appointments NOT today
      const todayStr = new Date().toISOString().split('T')[0];
      const upcoming = (allRes.data.data.appointments || []).filter((a) => {
        const apptDate = new Date(a.appointmentDate).toISOString().split('T')[0];
        return apptDate !== todayStr;
      });
      setUpcomingAppts(upcoming);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.approvalStatus && user.approvalStatus !== 'VERIFIED') {
      setIsLoading(false);
      return;
    }
    fetchAll();
  }, [user?.approvalStatus]);

  const handleToggleAvailability = async (type) => {
    setTogglingAvail(true);
    const newVal = !availability[type];
    try {
      await updateAvailability({
        onlineAvailable:  type === 'online'  ? newVal : availability.online,
        offlineAvailable: type === 'offline' ? newVal : availability.offline,
      });
      setAvailability((prev) => ({ ...prev, [type]: newVal }));
      toast.success(`${type} availability ${newVal ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setTogglingAvail(false);
    }
  };

  const stats = {
    total:          todayAppts.length,
    waiting:        todayAppts.filter((a) => ['BOOKED', 'IN_QUEUE', 'CHECKED_IN'].includes(a.status)).length,
    inConsultation: todayAppts.filter((a) => a.status === 'IN_CONSULTATION').length,
    completed:      todayAppts.filter((a) => a.status === 'COMPLETED').length,
  };

  const firstName = user?.name?.split(' ').slice(1).join(' ') || user?.name || 'Doctor';

  if (user?.approvalStatus && user.approvalStatus !== 'VERIFIED') {
    return (
      <DashboardLayout>
        <AccountApprovalState
          status={user.approvalStatus}
          roleLabel="Doctor"
          reason={user?.rejectionReason || user?.doctorProfile?.rejectionReason}
          primaryAction={{ to: '/doctor', label: 'Refresh status' }}
          secondaryAction={{ to: '/login/doctor', label: 'Back to doctor login' }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {firstName}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Availability Status</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { key: 'offline', label: 'Offline / In-Person', sub: 'Patients visit the clinic' },
              { key: 'online',  label: 'Online Consultation', sub: 'Video / remote sessions' },
            ].map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between flex-1 bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                <button
                  onClick={() => handleToggleAvailability(key)}
                  disabled={togglingAvail}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    availability[key] ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={availability[key]}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    availability[key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Today',     value: stats.total,          color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'Waiting',         value: stats.waiting,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'In Consultation', value: stats.inConsultation, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Completed',       value: stats.completed,      color: 'text-green-600',  bg: 'bg-green-50'  },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Today's Appointments */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Today's Appointments</h2>
            <Link to="/doctor/appointments" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : todayAppts.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">No appointments today</p>
              <p className="text-xs text-gray-400 mt-1">Your schedule is clear for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} onRefresh={fetchAll} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Appointments */}
        {(upcomingAppts.length > 0 || !isLoading) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Upcoming Appointments
                {upcomingAppts.length > 0 && (
                  <span className="ml-2 text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                    {upcomingAppts.length}
                  </span>
                )}
              </h2>
              <Link to="/doctor/appointments" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                View all →
              </Link>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6"><LoadingSpinner /></div>
            ) : upcomingAppts.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">No upcoming appointments</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                {upcomingAppts.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 font-bold text-sm">
                          {appt.patient?.name?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{appt.patient?.name || 'Patient'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">
                            {new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
                              weekday: 'short', day: 'numeric', month: 'short',
                            })}
                          </p>
                          {appt.slotTime && (
                            <span className="text-xs text-gray-400">· {appt.slotTime}</span>
                          )}
                          {appt.queueNumber && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              Queue #{appt.queueNumber}
                            </span>
                          )}
                        </div>
                        {appt.symptoms && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">"{appt.symptoms}"</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

const AppointmentCard = ({ appointment: appt, onRefresh }) => {
  const [isActing, setIsActing] = useState(false);

  const handleAction = async (action) => {
    setIsActing(true);
    try {
      if (action === 'start')    await startConsultation(appt.id);
      if (action === 'complete') await completeConsultation(appt.id);
      toast.success(action === 'start' ? 'Consultation started' : 'Consultation completed');
      onRefresh();
    } catch {
      toast.error('Action failed');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
            #{appt.queueNumber || '—'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{appt.patient?.name || 'Patient'}</p>
            <p className="text-sm text-gray-400">{appt.patient?.mobile}</p>
            {appt.symptoms && (
              <p className="text-xs text-gray-400 mt-0.5 italic">"{appt.symptoms}"</p>
            )}
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {['CHECKED_IN', 'IN_QUEUE', 'BOOKED'].includes(appt.status) && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => handleAction('start')}
            disabled={isActing}
            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isActing ? <LoadingSpinner size="sm" /> : '▶ Start Consultation'}
          </button>
        </div>
      )}

      {appt.status === 'IN_CONSULTATION' && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => handleAction('complete')}
            disabled={isActing}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isActing ? <LoadingSpinner size="sm" /> : '✅ Complete Consultation'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
