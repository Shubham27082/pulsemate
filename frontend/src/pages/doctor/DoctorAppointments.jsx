import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getDoctorAppointments, startConsultation, completeConsultation } from '../../api/doctor.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['All', 'BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'];

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [notesModal, setNotesModal] = useState(null); // { appointmentId, notes }

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const res = await getDoctorAppointments(params);
      setAppointments(res.data.data.appointments || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [statusFilter, dateFilter]);

  const handleStart = async (id) => {
    setActionLoading(id + 'start');
    try {
      await startConsultation(id);
      toast.success('Consultation started');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id, notes) => {
    setActionLoading(id + 'complete');
    try {
      await completeConsultation(id, notes);
      toast.success('Consultation completed');
      setNotesModal(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Appointments</h1>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="label">Filter by Date</label>
              <input
                type="date"
                className="input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="label">Filter by Status</label>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setDateFilter(''); setStatusFilter('All'); }}
                className="btn-ghost"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-border text-text-muted hover:border-primary-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : appointments.length === 0 ? (
          <EmptyState icon="📅" title="No appointments found" description="Try adjusting your filters" />
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                onStart={handleStart}
                onComplete={(id) => setNotesModal({ appointmentId: id, notes: '' })}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Notes / Complete Modal */}
      {notesModal && (
        <Modal isOpen={true} onClose={() => setNotesModal(null)} title="Complete Consultation">
          <div className="space-y-4">
            <div>
              <label className="label">Quick Notes (optional)</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Brief consultation notes..."
                value={notesModal.notes}
                onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
              />
            </div>
            <p className="text-xs text-text-muted">
              💡 You can write a detailed prescription after completing the consultation.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setNotesModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button
                onClick={() => handleComplete(notesModal.appointmentId, notesModal.notes)}
                disabled={!!actionLoading}
                className="btn-secondary flex-1"
              >
                {actionLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : '✅ Mark Complete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

const AppointmentRow = ({ appt, onStart, onComplete, actionLoading }) => (
  <div className="card">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
          appt.queueItem?.isFollowUp
            ? 'bg-orange-100 text-orange-700'
            : 'bg-primary-100 text-primary-700'
        }`}>
          {appt.queueItem?.isFollowUp ? '🔄' : `#${appt.queueNumber || '—'}`}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-text-primary">{appt.patient?.name || 'Patient'}</p>
            {appt.queueItem?.isFollowUp && (
              <span className="badge bg-orange-100 text-orange-700 text-xs">Follow-up</span>
            )}
          </div>
          <p className="text-sm text-text-muted">{appt.patient?.mobile}</p>
          <div className="flex flex-wrap gap-2 mt-1 text-xs text-text-muted">
            <span>📅 {new Date(appt.appointmentDate).toLocaleDateString()}</span>
            {appt.slotTime && <span>🕐 {appt.slotTime}</span>}
            <span>🏥 {appt.clinic?.name}</span>
            <span>{appt.appointmentType}</span>
          </div>
          {appt.symptoms && (
            <p className="text-xs text-text-muted mt-1 italic">"{appt.symptoms}"</p>
          )}
          {appt.notes && (
            <p className="text-xs text-secondary-600 mt-1">📝 {appt.notes}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={appt.status} />
        <div className="flex flex-wrap gap-2 justify-end">
          {['BOOKED', 'CHECKED_IN', 'IN_QUEUE'].includes(appt.status) && (
            <button
              onClick={() => onStart(appt.id)}
              disabled={actionLoading === appt.id + 'start'}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {actionLoading === appt.id + 'start' ? <LoadingSpinner size="sm" /> : '▶ Start'}
            </button>
          )}
          {appt.status === 'IN_CONSULTATION' && (
            <button
              onClick={() => onComplete(appt.id)}
              disabled={actionLoading === appt.id + 'complete'}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {actionLoading === appt.id + 'complete' ? <LoadingSpinner size="sm" /> : '✅ Complete'}
            </button>
          )}
          {/* Write / Edit prescription for completed appointments */}
          {appt.status === 'COMPLETED' && (
            <Link
              to={`/doctor/prescription/${appt.id}`}
              className="btn-outline text-xs py-1.5 px-3"
            >
              💊 {appt.prescription ? 'Edit Rx' : 'Write Rx'}
            </Link>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default DoctorAppointments;
