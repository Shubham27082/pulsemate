import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getTodayAppointments,
  getDoctorProfile,
  updateDoctorProfile,
  startConsultation,
  completeConsultation,
} from '../../api/doctor.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import useSocket from '../../hooks/useSocket';
import toast from 'react-hot-toast';

const DoctorQueue = () => {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avgMins, setAvgMins] = useState(10);
  const [savingAvg, setSavingAvg] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  // notes modal
  const [notesModal, setNotesModal] = useState(null); // { appointmentId }
  const [notes, setNotes] = useState('');
  const [completedApptId, setCompletedApptId] = useState(null); // show Rx prompt after complete
  const { joinStaffQueueRoom, onEvent } = useSocket();

  const fetchData = useCallback(async () => {
    try {
      const [apptRes, profileRes] = await Promise.all([
        getTodayAppointments(),
        getDoctorProfile(),
      ]);
      const appts = apptRes.data.data.appointments || [];
      const prof = profileRes.data.data.profile;
      setAppointments(appts);
      setProfile(prof);
      setAvgMins(prof?.avgConsultationMins || 10);

      const today = new Date().toISOString().split('T')[0];
      const clinicIds = [...new Set(appts.map((a) => a.clinicId))];
      clinicIds.forEach((clinicId) => {
        if (prof?.id) joinStaffQueueRoom({ clinicId, doctorId: prof.id, date: today });
      });
    } catch (err) {
      toast.error('Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  }, [joinStaffQueueRoom]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const cleanup = onEvent('queue:updated', () => fetchData());
    return cleanup;
  }, [onEvent, fetchData]);

  const handleSaveAvgMins = async () => {
    setSavingAvg(true);
    try {
      await updateDoctorProfile({ avgConsultationMins: avgMins });
      toast.success('Average consultation time updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSavingAvg(false);
    }
  };

  const handleStart = async (appointmentId) => {
    setActionLoading(appointmentId + 'start');
    try {
      await startConsultation(appointmentId);
      toast.success('Consultation started');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start consultation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOpen = (appointmentId) => {
    setNotesModal({ appointmentId });
    setNotes('');
  };

  const handleCompleteSubmit = async () => {
    if (!notesModal) return;
    setActionLoading(notesModal.appointmentId + 'complete');
    try {
      await completeConsultation(notesModal.appointmentId, notes);
      toast.success('Consultation completed');
      setCompletedApptId(notesModal.appointmentId);
      setNotesModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setActionLoading(null);
    }
  };

  const waiting = appointments.filter((a) => ['BOOKED', 'CHECKED_IN', 'IN_QUEUE'].includes(a.status));
  const inConsultation = appointments.filter((a) => a.status === 'IN_CONSULTATION');
  const completed = appointments.filter((a) => a.status === 'COMPLETED');

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Queue</h1>
            <p className="text-text-muted text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-secondary-500 rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-secondary-500 rounded-full pulse-dot" />
            </div>
            <span className="text-xs font-medium text-secondary-600">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Waiting', count: waiting.length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'In Consultation', count: inConsultation.length, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Completed', count: completed.length, color: 'text-secondary-600', bg: 'bg-secondary-50' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`card text-center ${bg}`}>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Avg consultation time */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">Avg. Consultation Time (minutes)</label>
              <p className="text-xs text-text-muted">Used to calculate patient wait times</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input w-20 text-center"
                value={avgMins}
                onChange={(e) => setAvgMins(parseInt(e.target.value) || 10)}
                min={1}
                max={60}
              />
              <button onClick={handleSaveAvgMins} disabled={savingAvg} className="btn-primary text-sm py-2 px-3">
                {savingAvg ? <LoadingSpinner size="sm" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : appointments.length === 0 ? (
          <EmptyState icon="🔢" title="No patients in queue today" description="Your queue is empty" />
        ) : (
          <div className="space-y-4">

            {/* In Consultation */}
            {inConsultation.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">In Consultation</h2>
                {inConsultation.map((appt) => (
                  <DoctorQueueCard
                    key={appt.id}
                    appt={appt}
                    highlight
                    actionLoading={actionLoading}
                    onStart={handleStart}
                    onComplete={handleCompleteOpen}
                  />
                ))}
              </div>
            )}

            {/* Waiting */}
            {waiting.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
                  Waiting ({waiting.length})
                </h2>
                {waiting.map((appt) => (
                  <DoctorQueueCard
                    key={appt.id}
                    appt={appt}
                    actionLoading={actionLoading}
                    onStart={handleStart}
                    onComplete={handleCompleteOpen}
                  />
                ))}
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
                  Completed ({completed.length})
                </h2>
                {completed.map((appt) => (
                  <DoctorQueueCard
                    key={appt.id}
                    appt={appt}
                    dimmed
                    actionLoading={actionLoading}
                    onStart={handleStart}
                    onComplete={handleCompleteOpen}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complete Consultation Modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNotesModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Complete Consultation</h2>
            <div className="mb-4">
              <label className="label">Doctor's Notes <span className="text-text-muted font-normal">(optional)</span></label>
              <textarea
                className="input w-full resize-none"
                rows={4}
                placeholder="Diagnosis, treatment plan, follow-up instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setNotesModal(null)} className="btn-outline flex-1">Cancel</button>
              <button
                onClick={handleCompleteSubmit}
                disabled={!!actionLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : '✅ Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Prescription prompt after completing */}
      {completedApptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCompletedApptId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-3">💊</div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Consultation Complete!</h2>
            <p className="text-sm text-text-muted mb-6">Would you like to write a prescription for this patient?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCompletedApptId(null)}
                className="btn-outline flex-1"
              >
                Skip
              </button>
              <Link
                to={`/doctor/prescription/${completedApptId}`}
                onClick={() => setCompletedApptId(null)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                💊 Write Prescription
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const DoctorQueueCard = ({ appt, highlight, dimmed, actionLoading, onStart, onComplete }) => {
  const canStart = ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'CALLED'].includes(appt.status);
  const canComplete = appt.status === 'IN_CONSULTATION';
  const isDone = appt.status === 'COMPLETED';

  return (
    <div className={`card mb-2 transition-all
      ${highlight ? 'border-l-4 border-l-purple-500 bg-purple-50/30' : ''}
      ${dimmed ? 'opacity-60' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
            highlight ? 'bg-purple-100 text-purple-700' :
            isDone ? 'bg-green-100 text-green-700' :
            'bg-primary-100 text-primary-700'
          }`}>
            #{appt.queueNumber || '—'}
          </div>
          <div>
            <p className="font-semibold text-text-primary">{appt.patient?.name || 'Patient'}</p>
            <p className="text-xs text-text-muted">{appt.patient?.mobile}</p>
            {appt.symptoms && (
              <p className="text-xs text-text-muted mt-0.5 italic truncate max-w-xs">"{appt.symptoms}"</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <StatusBadge status={appt.status} />
          {appt.estimatedWaitMinutes && !isDone && (
            <p className="text-xs text-text-muted mt-1">~{appt.estimatedWaitMinutes} min wait</p>
          )}
        </div>
      </div>

      {/* Notes if completed */}
      {appt.notes && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-secondary-600">📝 {appt.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {(canStart || canComplete) && (
        <div className="mt-3 pt-3 border-t border-border flex gap-2">
          {canStart && (
            <button
              onClick={() => onStart(appt.id)}
              disabled={!!actionLoading}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
            >
              {actionLoading === appt.id + 'start'
                ? <LoadingSpinner size="sm" />
                : '▶️ Start Consultation'}
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => onComplete(appt.id)}
              disabled={!!actionLoading}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5 ml-auto"
            >
              ✅ Complete
            </button>
          )}
        </div>
      )}

      {/* Write / Edit prescription for completed */}
      {isDone && (
        <div className="mt-2 pt-2 border-t border-border">
          <Link
            to={`/doctor/prescription/${appt.id}`}
            className="w-full text-sm py-2 px-3 rounded-lg border border-primary-300 text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors font-medium flex items-center justify-center gap-2"
          >
            💊 {appt.prescription ? 'Edit Prescription' : 'Write Prescription'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default DoctorQueue;
