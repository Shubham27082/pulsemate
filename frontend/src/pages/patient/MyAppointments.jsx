import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyAppointments, cancelAppointment } from '../../api/patient.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'BOOKED', 'IN_QUEUE', 'COMPLETED', 'CANCELLED'];

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const params = activeFilter !== 'All' ? { status: activeFilter } : {};
      const res = await getMyAppointments(params);
      setAppointments(res.data.data || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [activeFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">My Appointments</h1>
          <Link to="/patient/prescriptions" className="text-sm text-primary-600 hover:underline">
            💊 My Prescriptions
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-border text-text-muted hover:border-primary-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No appointments found"
            description="Book an appointment with a doctor to get started"
            action={<Link to="/patient/search" className="btn-primary">Find a Doctor</Link>}
          />
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                onCancel={handleCancel}
                cancellingId={cancellingId}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const AppointmentCard = ({ appt, onCancel, cancellingId }) => {
  const hasPrescription = !!appt.prescription?.id;
  const paymentStatus = appt.payment?.status;
  const isPaid = paymentStatus === 'PAID';
  const needsPayment = appt.status === 'COMPLETED' && !isPaid && (appt.doctor?.consultationFee > 0);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold">
              {appt.doctor?.user?.name?.charAt(0) || 'D'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{appt.doctor?.user?.name}</h3>
            <p className="text-sm text-primary-600">{appt.doctor?.specialization}</p>
            <p className="text-sm text-text-muted mt-0.5">
              {appt.clinic?.name} • {appt.clinic?.city}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={appt.status} />
          {isPaid && <span className="badge bg-green-100 text-green-700">✓ Paid</span>}
          {needsPayment && <span className="badge bg-red-100 text-red-700">Payment Due</span>}
          {appt.prescription?.requiresFollowUp && (
            <span className="badge bg-orange-100 text-orange-700">Follow-up</span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-text-muted">Date</p>
          <p className="font-medium">{new Date(appt.appointmentDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-text-muted">Type</p>
          <p className="font-medium">{appt.appointmentType}</p>
        </div>
        {appt.queueNumber && (
          <div>
            <p className="text-text-muted">Queue #</p>
            <p className="font-medium">{appt.queueNumber}</p>
          </div>
        )}
        {appt.estimatedWaitMinutes && (
          <div>
            <p className="text-text-muted">Est. Wait</p>
            <p className="font-medium">{appt.estimatedWaitMinutes} min</p>
          </div>
        )}
      </div>

      {appt.symptoms && (
        <p className="text-xs text-text-muted mt-3">Symptoms: {appt.symptoms}</p>
      )}

      {/* Follow-up date reminder */}
      {appt.prescription?.followUpDate && (
        <div className="mt-3 bg-orange-50 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-sm">📅</span>
          <p className="text-xs text-orange-700">
            Follow-up on{' '}
            <strong>
              {new Date(appt.prescription.followUpDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </strong>
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Live queue tracking */}
        {['IN_QUEUE', 'BOOKED', 'CHECKED_IN'].includes(appt.status) && appt.appointmentType === 'OFFLINE' && (
          <Link to={`/patient/queue/${appt.id}`} className="btn-outline text-sm py-2 flex-1 text-center">
            📡 Track Live Queue
          </Link>
        )}

        {/* View prescription */}
        {hasPrescription && (
          <Link
            to={`/patient/prescriptions`}
            className="btn-outline text-sm py-2 flex-1 text-center"
          >
            💊 View Prescription
          </Link>
        )}

        {/* Pay now */}
        {needsPayment && (
          <Link
            to={`/patient/payment/${appt.id}`}
            className="btn-primary text-sm py-2 flex-1 text-center"
          >
            💳 Pay Now
          </Link>
        )}

        {/* Cancel */}
        {['BOOKED', 'IN_QUEUE'].includes(appt.status) && (
          <button
            onClick={() => onCancel(appt.id)}
            disabled={cancellingId === appt.id}
            className="btn-danger text-sm py-2 flex-1"
          >
            {cancellingId === appt.id ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
