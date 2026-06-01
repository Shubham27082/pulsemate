import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyPrescriptions } from '../../api/prescription.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await getMyPrescriptions({ page, limit: LIMIT });
        setPrescriptions(res.data.data.prescriptions || []);
        setTotal(res.data.data.total || 0);
      } catch {
        toast.error('Failed to load prescriptions');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <DashboardLayout>
      <div className="page-container">
        <h1 className="text-2xl font-bold text-text-primary mb-6">My Prescriptions</h1>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon="💊"
            title="No prescriptions yet"
            description="Prescriptions from your completed appointments will appear here"
          />
        ) : (
          <>
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <PrescriptionCard key={rx.id} rx={rx} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="px-4 py-2 text-sm text-text-muted">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const PrescriptionCard = ({ rx }) => {
  const [expanded, setExpanded] = useState(false);
  const medicines = Array.isArray(rx.medicines) ? rx.medicines : [];

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">💊</span>
          </div>
          <div>
            <p className="font-semibold text-text-primary">
              Dr. {rx.doctor?.user?.name}
            </p>
            <p className="text-sm text-text-muted">
              {rx.appointment?.clinic?.name} • {rx.appointment?.clinic?.city}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {new Date(rx.appointment?.appointmentDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {rx.requiresFollowUp && (
            <span className="badge bg-orange-100 text-orange-700">Follow-up Required</span>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-sm text-primary-600 hover:underline"
          >
            {expanded ? 'Hide details ↑' : 'View details ↓'}
          </button>
        </div>
      </div>

      {/* Diagnosis */}
      {rx.diagnosis && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Diagnosis</p>
          <p className="text-sm text-text-primary mt-1">{rx.diagnosis}</p>
        </div>
      )}

      {/* Expanded: medicines + instructions */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {/* Medicines */}
          {medicines.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                Medicines ({medicines.length})
              </p>
              <div className="space-y-2">
                {medicines.map((med, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-text-primary text-sm">{med.name}</p>
                      <span className="text-xs text-primary-600 font-medium">{med.dosage}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-text-muted">
                      {med.frequency && <span>🕐 {med.frequency}</span>}
                      {med.duration && <span>📅 {med.duration}</span>}
                    </div>
                    {med.notes && (
                      <p className="text-xs text-text-muted mt-1 italic">{med.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {rx.instructions && (
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                Instructions
              </p>
              <p className="text-sm text-text-primary bg-yellow-50 rounded-lg p-3">
                📋 {rx.instructions}
              </p>
            </div>
          )}

          {/* Follow-up date */}
          {rx.followUpDate && (
            <div className="bg-orange-50 rounded-lg p-3 flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                  Follow-up Date
                </p>
                <p className="text-sm font-semibold text-orange-800">
                  {new Date(rx.followUpDate).toLocaleDateString('en-IN', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="btn-outline w-full text-sm py-2"
          >
            🖨️ Print Prescription
          </button>
        </div>
      )}
    </div>
  );
};

export default MyPrescriptions;
