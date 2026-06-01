import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyClinics, getClinicAppointments } from '../../api/clinic.api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['', 'BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

const OwnerAppointments = () => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    getMyClinics()
      .then((res) => {
        const list = res.data.data.clinics || [];
        setClinics(list);
        if (list.length > 0) setSelectedClinicId(list[0].id);
      })
      .catch(() => toast.error('Failed to load clinics'));
  }, []);

  useEffect(() => {
    if (!selectedClinicId) return;
    fetchAppointments();
  }, [selectedClinicId, dateFilter, statusFilter, pagination.page]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const params = { page: pagination.page, limit: 30 };
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await getClinicAppointments(selectedClinicId, params);
      setAppointments(res.data.data || []);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="page-container">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Appointments</h1>

        {/* Clinic selector */}
        {clinics.length > 1 && (
          <div className="mb-4">
            <select
              className="input max-w-xs"
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
            >
              {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s || 'All Statuses'}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setDateFilter(today); setPagination((p) => ({ ...p, page: 1 })); }}
                className="btn-outline text-sm py-2"
              >
                Today
              </button>
              <button
                onClick={() => { setDateFilter(''); setStatusFilter(''); setPagination((p) => ({ ...p, page: 1 })); }}
                className="btn-ghost text-sm py-2"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-text-muted mb-4">{pagination.total} appointments</p>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No appointments found"
            description="Appointments will appear here once patients book with your clinic's doctors."
          />
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div key={appt.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 flex-shrink-0 text-sm">
                      #{appt.queueNumber || '—'}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{appt.patient?.name}</p>
                      <p className="text-sm text-text-muted">{appt.patient?.mobile}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-text-muted">
                        <span>👨‍⚕️ Dr. {appt.doctor?.user?.name}</span>
                        <span>📅 {new Date(appt.appointmentDate).toLocaleDateString()}</span>
                        {appt.slotTime && <span>🕐 {appt.slotTime}</span>}
                        <span>{appt.appointmentType}</span>
                      </div>
                      {appt.symptoms && (
                        <p className="text-xs text-text-muted mt-1 italic">"{appt.symptoms}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={appt.status} />
                    {appt.queueItem && (
                      <span className="text-xs text-text-muted">Pos {appt.queueItem.position}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.total > 30 && (
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="btn-outline text-sm py-2 px-4"
                >
                  ← Prev
                </button>
                <span className="text-sm text-text-muted self-center">Page {pagination.page}</span>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={appointments.length < 30}
                  className="btn-outline text-sm py-2 px-4"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerAppointments;
