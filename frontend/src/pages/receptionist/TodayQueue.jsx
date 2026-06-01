import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getQueue, callNext, skipPatient, completePatient,
  pauseQueue, resumeQueue, checkIn,
} from '../../api/reception.api';
import { markCashPayment } from '../../api/payment.api';
import { getMe } from '../../api/auth.api';
import { getStaff } from '../../api/clinic.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import useSocket from '../../hooks/useSocket';
import toast from 'react-hot-toast';

const TodayQueue = () => {
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [queue, setQueue] = useState(null);
  const [queueItems, setQueueItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  // payment modal
  const [payModal, setPayModal] = useState(null); // { appointmentId, patientName, consultationFee }
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  // track which appointments are already paid
  const [paidAppointments, setPaidAppointments] = useState(new Set());
  const { joinStaffQueueRoom, onEvent } = useSocket();

  // Load clinic + doctors on mount
  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await getMe();
        const staffClinics = meRes.data.data.user?.clinicStaff || [];
        if (staffClinics.length === 0) { setIsLoading(false); return; }

        const myClinic = staffClinics[0].clinic;
        setClinic(myClinic);

        const staffRes = await getStaff(myClinic.id);
        const doctorStaff = (staffRes.data.data.staff || []).filter((s) => s.role === 'DOCTOR');
        setDoctors(doctorStaff);

        if (doctorStaff.length > 0) setSelectedDoctor(doctorStaff[0]);
      } catch (err) {
        toast.error('Failed to load clinic data');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchQueue = useCallback(async () => {
    if (!selectedDoctor || !clinic) return;
    const doctorProfileId = selectedDoctor.user?.doctorProfile?.id;
    if (!doctorProfileId) return;

    try {
      const res = await getQueue(doctorProfileId, clinic.id);
      const items = res.data.data.queueItems || [];
      setQueue(res.data.data.queue);
      setQueueItems(items);

      // Build paid set directly from queue item data — no extra API calls
      const paidSet = new Set(
        items
          .filter((i) => i.appointment?.payment?.status === 'PAID')
          .map((i) => i.appointment.id)
      );
      setPaidAppointments(paidSet);

      const today = new Date().toISOString().split('T')[0];
      joinStaffQueueRoom({ clinicId: clinic.id, doctorId: doctorProfileId, date: today });
    } catch (err) {
      toast.error('Failed to load queue');
    }
  }, [selectedDoctor, clinic, joinStaffQueueRoom]);

  useEffect(() => {
    if (selectedDoctor) fetchQueue();
  }, [fetchQueue, selectedDoctor]);

  useEffect(() => {
    const cleanup = onEvent('queue:updated', () => fetchQueue());
    return cleanup;
  }, [onEvent, fetchQueue]);

  const handleAction = async (action, id) => {
    setActionLoading(id + action);
    try {
      const actions = {
        callNext: () => callNext(id),
        skip:     () => skipPatient(id),
        complete: () => completePatient(id),
        pause:    () => pauseQueue(id),
        resume:   () => resumeQueue(id),
        checkIn:  () => checkIn(id),
      };
      await actions[action]();
      const labels = {
        callNext: 'Next patient called!',
        skip:     'Patient skipped',
        complete: 'Marked complete',
        pause:    'Queue paused',
        resume:   'Queue resumed',
        checkIn:  'Patient checked in',
      };
      toast.success(labels[action]);
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const openPayModal = (item) => {
    const fee = item.appointment?.doctor?.consultationFee
      ?? selectedDoctor?.user?.doctorProfile?.consultationFee
      ?? '';
    setPayModal({
      appointmentId: item.appointment?.id,
      patientName: item.patient?.name,
      consultationFee: fee,
    });
    setPayAmount(fee !== '' ? String(fee) : '');
  };

  const handleCashPayment = async () => {
    if (!payModal) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }

    setPaying(true);
    try {
      await markCashPayment({ appointmentId: payModal.appointmentId, amount });
      toast.success(`Cash payment of ₹${amount} recorded for ${payModal.patientName}`);
      setPaidAppointments((prev) => new Set([...prev, payModal.appointmentId]));
      setPayModal(null);
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const waitingCount   = queueItems.filter((i) => i.status === 'WAITING').length;
  const completedCount = queueItems.filter((i) => i.status === 'COMPLETED').length;
  const currentItem    = queueItems.find((i) => ['CALLED', 'IN_CONSULTATION'].includes(i.status));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Today's Queue</h1>
            <p className="text-text-muted text-sm mt-1">
              {clinic?.name} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
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

        {/* Doctor selector */}
        {doctors.length > 0 ? (
          <div className="card mb-6">
            <label className="label">Select Doctor</label>
            <div className="flex flex-wrap gap-2">
              {doctors.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDoctor(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    selectedDoctor?.id === d.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-border text-text-muted hover:border-gray-300'
                  }`}
                >
                  {d.user?.name}
                  {d.user?.doctorProfile?.specialization && (
                    <span className="text-xs ml-1 opacity-70">({d.user.doctorProfile.specialization})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon="👨‍⚕️" title="No doctors found" description="Add doctors to your clinic first" />
        )}

        {selectedDoctor && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card text-center">
                <p className="text-2xl font-bold text-yellow-600">{waitingCount}</p>
                <p className="text-xs text-text-muted mt-1">Waiting</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-secondary-600">{completedCount}</p>
                <p className="text-xs text-text-muted mt-1">Completed</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-text-primary">{queueItems.length}</p>
                <p className="text-xs text-text-muted mt-1">Total</p>
              </div>
            </div>

            {/* Currently serving */}
            {currentItem && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🩺</span>
                  <div>
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Now Serving</p>
                    <p className="font-bold text-purple-800">
                      #{currentItem.queueNumber} — {currentItem.patient?.name}
                    </p>
                  </div>
                </div>
                <StatusBadge status={currentItem.status} />
              </div>
            )}

            {/* Paused banner */}
            {queue?.status === 'PAUSED' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <span className="text-2xl">⏸️</span>
                <p className="font-medium text-yellow-800">Queue is paused</p>
              </div>
            )}

            {/* Controls */}
            {queue && (
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => handleAction('callNext', queue.id)}
                  disabled={!!actionLoading || queue.status === 'PAUSED' || waitingCount === 0}
                  className="btn-primary flex-1 py-3"
                >
                  {actionLoading === queue.id + 'callNext'
                    ? <LoadingSpinner size="sm" className="mx-auto" />
                    : '📢 Call Next Patient'}
                </button>
                {queue.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleAction('pause', queue.id)}
                    disabled={!!actionLoading}
                    className="btn-outline px-4"
                  >
                    ⏸️ Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction('resume', queue.id)}
                    disabled={!!actionLoading}
                    className="btn-secondary px-4"
                  >
                    ▶️ Resume
                  </button>
                )}
              </div>
            )}

            {/* Queue list */}
            {queueItems.length === 0 ? (
              <EmptyState icon="👥" title="Queue is empty" description="No patients in queue yet" />
            ) : (
              <div className="space-y-3">
                {queueItems.map((item) => (
                  <QueueItemCard
                    key={item.id}
                    item={item}
                    onAction={handleAction}
                    actionLoading={actionLoading}
                    isPaid={paidAppointments.has(item.appointment?.id)}
                    onOpenPayModal={openPayModal}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cash Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPayModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-text-primary mb-1">Record Cash Payment</h2>
            <p className="text-sm text-text-muted mb-5">Patient: <strong>{payModal.patientName}</strong></p>

            <div className="mb-5">
              <label className="label">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">₹</span>
                <input
                  type="number"
                  className="input pl-7 w-full text-lg font-semibold"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  autoFocus
                />
              </div>
              {payModal.consultationFee && (
                <p className="text-xs text-text-muted mt-1">
                  Consultation fee: ₹{payModal.consultationFee}
                  <button
                    className="ml-2 text-primary-600 underline"
                    onClick={() => setPayAmount(String(payModal.consultationFee))}
                  >
                    Use this
                  </button>
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPayModal(null)} className="btn-outline flex-1">Cancel</button>
              <button
                onClick={handleCashPayment}
                disabled={paying}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {paying ? <LoadingSpinner size="sm" /> : '💵 Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const QueueItemCard = ({ item, onAction, actionLoading, isPaid, onOpenPayModal }) => {
  const isActive  = ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(item.status);
  const isCurrent = ['CALLED', 'IN_CONSULTATION'].includes(item.status);
  const isDone    = item.status === 'COMPLETED';

  return (
    <div className={`card transition-all
      ${isCurrent ? 'border-l-4 border-l-purple-500' : ''}
      ${item.isFollowUp ? 'border-l-4 border-l-orange-400' : ''}
      ${!isActive && !isDone ? 'opacity-60' : ''}
    `}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
            item.isFollowUp   ? 'bg-orange-100 text-orange-700' :
            isCurrent         ? 'bg-purple-100 text-purple-700' :
            isDone            ? 'bg-green-100 text-green-700'   :
                                'bg-gray-100 text-gray-700'
          }`}>
            {item.isFollowUp ? '🔄' : `#${item.queueNumber}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary">{item.patient?.name || 'Patient'}</p>
              {item.isFollowUp && (
                <span className="badge bg-orange-100 text-orange-700 text-xs">Follow-up</span>
              )}
            </div>
            <p className="text-sm text-text-muted">{item.patient?.mobile}</p>
            {item.appointment?.symptoms && (
              <p className="text-xs text-text-muted mt-0.5 italic truncate max-w-xs">
                "{item.appointment.symptoms}"
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={item.status} />
          {item.position > 0 && isActive && (
            <span className="text-xs text-text-muted">Pos {item.position}</span>
          )}
          {isDone && isPaid && (
            <span className="text-xs font-medium text-green-600">💵 Paid</span>
          )}
        </div>
      </div>

      {/* Active item actions */}
      {isActive && (
        <div className="mt-3 pt-3 border-t border-border flex gap-2 flex-wrap">
          {item.status === 'WAITING' && (
            <button
              onClick={() => onAction('checkIn', item.id)}
              disabled={!!actionLoading}
              className="btn-outline text-xs py-1.5 px-3"
            >
              ✓ Check In
            </button>
          )}
          {item.status !== 'IN_CONSULTATION' && (
            <button
              onClick={() => onAction('skip', item.id)}
              disabled={!!actionLoading}
              className="btn-ghost text-xs py-1.5 px-3"
            >
              Skip
            </button>
          )}
          <button
            onClick={() => onAction('complete', item.id)}
            disabled={!!actionLoading}
            className="btn-secondary text-xs py-1.5 px-3 ml-auto"
          >
            {actionLoading === item.id + 'complete'
              ? <LoadingSpinner size="sm" />
              : '✅ Complete'}
          </button>
        </div>
      )}

      {/* Payment section for completed items */}
      {isDone && item.appointment?.id && (
        <div className="mt-2 pt-2 border-t border-border">
          {isPaid ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium py-1">
              <span>✅</span>
              <span>Payment recorded</span>
            </div>
          ) : (
            <button
              onClick={() => onOpenPayModal(item)}
              disabled={!!actionLoading}
              className="w-full text-sm py-2 px-3 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors font-medium flex items-center justify-center gap-2"
            >
              💵 Record Cash Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TodayQueue;
