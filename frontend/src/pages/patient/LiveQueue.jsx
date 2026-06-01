import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getLiveQueue } from '../../api/patient.api';
import useSocket from '../../hooks/useSocket';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const LiveQueue = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { joinQueueRoom, onEvent, leaveQueueRoom } = useSocket();
  const roomRef = useRef(null);

  const fetchQueueData = async () => {
    try {
      const res = await getLiveQueue(appointmentId);
      const { appointment, queueInfo } = res.data.data;
      setQueueData({ appointment, queueInfo });
      setLastUpdated(new Date());

      // Join socket room
      if (queueInfo?.roomName && roomRef.current !== queueInfo.roomName) {
        const [, clinicId, doctorId, date] = queueInfo.roomName.split(':');
        joinQueueRoom({ clinicId, doctorId, date });
        roomRef.current = queueInfo.roomName;
      }
    } catch (err) {
      toast.error('Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Poll every 30 seconds as fallback
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [appointmentId]);

  // Socket event listeners
  useEffect(() => {
    const cleanups = [
      onEvent('queue:updated', (data) => {
        fetchQueueData();
        toast('Queue updated', { icon: '🔄' });
      }),
      onEvent('queue:called', (data) => {
        if (queueData?.queueInfo?.queueNumber === data.queueNumber) {
          toast.success('🔔 You are being called! Please proceed to the doctor.', { duration: 10000 });
        }
        fetchQueueData();
      }),
      onEvent('queue:positionUpdated', () => {
        fetchQueueData();
      }),
      onEvent('queue:paused', () => {
        toast('Queue has been paused', { icon: '⏸️' });
        fetchQueueData();
      }),
      onEvent('queue:resumed', () => {
        toast('Queue has resumed', { icon: '▶️' });
        fetchQueueData();
      }),
    ];

    return () => cleanups.forEach((cleanup) => cleanup && cleanup());
  }, [queueData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const { appointment, queueInfo } = queueData || {};

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">
        <button
          onClick={() => navigate('/patient/appointments')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 text-sm"
        >
          ← Back to appointments
        </button>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative">
            <div className="w-3 h-3 bg-secondary-500 rounded-full" />
            <div className="absolute inset-0 w-3 h-3 bg-secondary-500 rounded-full pulse-dot" />
          </div>
          <span className="text-sm font-medium text-secondary-600">Live Queue</span>
          {lastUpdated && (
            <span className="text-xs text-text-muted ml-auto">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Doctor & Clinic Info */}
        <div className="card mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-primary-700 font-bold text-lg">
                {appointment?.doctor?.user?.name?.charAt(0) || 'D'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-text-primary">{appointment?.doctor?.user?.name}</p>
              <p className="text-sm text-text-muted">{appointment?.clinic?.name}</p>
            </div>
          </div>
        </div>

        {!queueInfo ? (
          <div className="card text-center py-8">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-text-primary">Queue not started yet</p>
            <p className="text-sm text-text-muted mt-1">The clinic will start the queue soon</p>
          </div>
        ) : (
          <>
            {/* Queue Status Banner */}
            {queueInfo.queueStatus === 'PAUSED' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <span className="text-2xl">⏸️</span>
                <div>
                  <p className="font-medium text-yellow-800">Queue is paused</p>
                  <p className="text-sm text-yellow-600">Please wait, the queue will resume shortly</p>
                </div>
              </div>
            )}

            {/* Your Queue Number */}
            <div className="card mb-4 text-center">
              <p className="text-sm text-text-muted mb-2">Your Queue Number</p>
              <div className="text-6xl font-bold text-primary-600 mb-2">
                #{queueInfo.queueNumber}
              </div>
              <StatusBadge status={queueInfo.status} />

              {queueInfo.status === 'CALLED' && (
                <div className="mt-4 p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                  <p className="font-semibold text-secondary-700 text-lg">🔔 You're being called!</p>
                  <p className="text-sm text-secondary-600">Please proceed to the doctor's room</p>
                </div>
              )}
            </div>

            {/* Queue Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="card text-center">
                <p className="text-3xl font-bold text-text-primary">{queueInfo.position}</p>
                <p className="text-sm text-text-muted mt-1">Your Position</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-bold text-text-primary">
                  {queueInfo.estimatedWaitMinutes || '—'}
                </p>
                <p className="text-sm text-text-muted mt-1">Est. Wait (min)</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-bold text-text-primary">{queueInfo.patientsAhead}</p>
                <p className="text-sm text-text-muted mt-1">Patients Ahead</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-bold text-text-primary">
                  {queueInfo.currentlyServing ? `#${queueInfo.currentlyServing}` : '—'}
                </p>
                <p className="text-sm text-text-muted mt-1">Currently Serving</p>
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchQueueData}
              className="btn-outline w-full"
            >
              🔄 Refresh Queue Status
            </button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LiveQueue;
