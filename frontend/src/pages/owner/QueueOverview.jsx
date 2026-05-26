import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyClinics, getStaff } from '../../api/clinic.api';
import { getQueue } from '../../api/reception.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import useSocket from '../../hooks/useSocket';
import toast from 'react-hot-toast';

const QueueOverview = () => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [queues, setQueues] = useState({}); // { doctorId: { queue, queueItems } }
  const [isLoading, setIsLoading] = useState(true);
  const { joinStaffQueueRoom, onEvent } = useSocket();

  useEffect(() => {
    getMyClinics()
      .then((res) => {
        const list = res.data.data.clinics || [];
        setClinics(list);
        if (list.length > 0) setSelectedClinic(list[0]);
      })
      .catch(() => toast.error('Failed to load clinics'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClinic) return;
    fetchDoctorsAndQueues();
  }, [selectedClinic]);

  const fetchDoctorsAndQueues = async () => {
    if (!selectedClinic) return;
    setIsLoading(true);
    try {
      const staffRes = await getStaff(selectedClinic.id);
      const doctorStaff = (staffRes.data.data.staff || []).filter((s) => s.role === 'DOCTOR');
      setDoctors(doctorStaff);

      const today = new Date().toISOString().split('T')[0];
      const queueData = {};

      await Promise.all(
        doctorStaff.map(async (s) => {
          const doctorProfileId = s.user?.doctorProfile?.id;
          if (!doctorProfileId) return;
          try {
            const res = await getQueue(doctorProfileId, selectedClinic.id);
            queueData[doctorProfileId] = {
              queue: res.data.data.queue,
              queueItems: res.data.data.queueItems || [],
              doctorName: s.user?.name,
            };
            // Join socket room for live updates
            joinStaffQueueRoom({ clinicId: selectedClinic.id, doctorId: doctorProfileId, date: today });
          } catch {
            queueData[doctorProfileId] = { queue: null, queueItems: [], doctorName: s.user?.name };
          }
        })
      );

      setQueues(queueData);
    } catch (err) {
      toast.error('Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  };

  // Live updates
  useEffect(() => {
    const cleanup = onEvent('queue:updated', () => fetchDoctorsAndQueues());
    return cleanup;
  }, [onEvent, selectedClinic]);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Queue Overview</h1>
            <p className="text-text-muted text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-secondary-500 rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-secondary-500 rounded-full pulse-dot" />
            </div>
            <span className="text-xs font-medium text-secondary-600">Live</span>
          </div>
        </div>

        {/* Clinic selector */}
        {clinics.length > 1 && (
          <div className="mb-6">
            <select
              className="input max-w-xs"
              value={selectedClinic?.id || ''}
              onChange={(e) => setSelectedClinic(clinics.find((c) => c.id === e.target.value))}
            >
              {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : Object.keys(queues).length === 0 ? (
          <EmptyState
            icon="🔢"
            title="No active queues"
            description="Queues will appear here once doctors start seeing patients"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(queues).map(([doctorId, data]) => (
              <DoctorQueuePanel key={doctorId} data={data} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const DoctorQueuePanel = ({ data }) => {
  const { queue, queueItems, doctorName } = data;
  const waiting = queueItems.filter((i) => i.status === 'WAITING').length;
  const completed = queueItems.filter((i) => i.status === 'COMPLETED').length;
  const current = queueItems.find((i) => ['CALLED', 'IN_CONSULTATION'].includes(i.status));

  return (
    <div className="card">
      {/* Doctor header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold">{doctorName?.charAt(0) || 'D'}</span>
          </div>
          <div>
            <p className="font-semibold text-text-primary">{doctorName}</p>
            {queue && (
              <StatusBadge status={queue.status} />
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-text-muted">{waiting} waiting</p>
          <p className="text-secondary-600">{completed} done</p>
        </div>
      </div>

      {/* Currently serving */}
      {current && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Now Serving</p>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-purple-800">
              #{current.queueNumber} — {current.patient?.name}
            </p>
            <StatusBadge status={current.status} />
          </div>
        </div>
      )}

      {/* Queue items */}
      {queueItems.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">No patients in queue</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {queueItems
            .filter((i) => i.status === 'WAITING')
            .slice(0, 5)
            .map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-muted w-6">#{item.queueNumber}</span>
                  <span className="text-sm text-text-primary">{item.patient?.name}</span>
                </div>
                <span className="text-xs text-text-muted">Pos {item.position}</span>
              </div>
            ))}
          {waiting > 5 && (
            <p className="text-xs text-text-muted text-center pt-1">+{waiting - 5} more waiting</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QueueOverview;
