import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getPendingClinicApprovals,
  getPendingDoctorApprovals,
  decideClinicApproval,
  decideDoctorApproval,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'clinics', label: 'Clinic Applications' },
  { key: 'doctors', label: 'Doctor Applications' },
];

const ACTION_CONFIG = {
  VERIFIED: {
    title: 'Approve application',
    confirmLabel: 'Approve',
    accent: 'bg-green-600 hover:bg-green-700',
    helper: 'Approving this application unlocks the full operational portal.',
  },
  REJECTED: {
    title: 'Reject application',
    confirmLabel: 'Reject',
    accent: 'bg-red-600 hover:bg-red-700',
    helper: 'Add a clear reason so the applicant knows what needs to be fixed.',
  },
  SUSPENDED: {
    title: 'Suspend application',
    confirmLabel: 'Suspend',
    accent: 'bg-gray-800 hover:bg-gray-900',
    helper: 'Use suspension for cases that should be blocked rather than simply rejected.',
  },
};

const ClinicApprovals = () => {
  const [activeTab, setActiveTab] = useState('clinics');
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [decisionState, setDecisionState] = useState({
    open: false,
    entityType: null,
    entity: null,
    status: 'VERIFIED',
    reason: '',
  });

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const [clinicRes, doctorRes] = await Promise.all([
        getPendingClinicApprovals(),
        getPendingDoctorApprovals(),
      ]);
      setClinics(clinicRes.data.data?.clinics || []);
      setDoctors(doctorRes.data.data?.doctors || []);
    } catch (_) {
      toast.error('Failed to load approval queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const counts = useMemo(
    () => ({
      clinics: clinics.length,
      doctors: doctors.length,
      total: clinics.length + doctors.length,
    }),
    [clinics.length, doctors.length]
  );

  const openDecisionModal = (entityType, entity, status) => {
    setDecisionState({
      open: true,
      entityType,
      entity,
      status,
      reason: '',
    });
  };

  const closeDecisionModal = () => {
    setDecisionState({
      open: false,
      entityType: null,
      entity: null,
      status: 'VERIFIED',
      reason: '',
    });
  };

  const handleDecision = async () => {
    const { entityType, entity, status, reason } = decisionState;
    if (!entity) return;
    if (status !== 'VERIFIED' && !reason.trim()) {
      toast.error('Reason is required for rejection or suspension');
      return;
    }

    setActionLoading(entity.id);
    try {
      if (entityType === 'clinic') {
        await decideClinicApproval(entity.id, { status, reason: reason.trim() || undefined });
      } else {
        await decideDoctorApproval(entity.id, { status, reason: reason.trim() || undefined });
      }
      toast.success(`${entityType === 'clinic' ? 'Clinic' : 'Doctor'} marked as ${status.toLowerCase()}`);
      closeDecisionModal();
      loadApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const activeItems = activeTab === 'clinics' ? clinics : doctors;

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Approval Center</h1>
            <p className="mt-1 text-text-muted">Review new clinic and doctor applications before they access the full platform.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:w-auto">
            <SummaryCard label="Total pending" value={counts.total} tone="bg-yellow-50 text-yellow-700" />
            <SummaryCard label="Clinics" value={counts.clinics} tone="bg-orange-50 text-orange-700" />
            <SummaryCard label="Doctors" value={counts.doctors} tone="bg-green-50 text-green-700" />
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'border border-border bg-white text-text-muted hover:border-primary-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : activeItems.length === 0 ? (
          <EmptyState
            icon={activeTab === 'clinics' ? '🏥' : '🩺'}
            title={`No pending ${activeTab}`}
            description={`There are no ${activeTab} waiting for review right now.`}
          />
        ) : (
          <div className="space-y-4">
            {activeTab === 'clinics'
              ? clinics.map((clinic) => (
                  <div key={clinic.id} className="card">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-text-primary">{clinic.name}</h3>
                          <StatusBadge status={clinic.approvalStatus} />
                        </div>
                        <div className="grid gap-2 text-sm text-text-muted sm:grid-cols-2">
                          <p>Owner: {clinic.owner?.name || 'Unknown'} ({clinic.owner?.email || clinic.owner?.mobile})</p>
                          <p>Clinic phone: {clinic.phone || 'Not provided'}</p>
                          <p>Location: {[clinic.city, clinic.state, clinic.pincode].filter(Boolean).join(', ') || 'Not provided'}</p>
                          <p>Opening hours: {clinic.openingHours || 'Not provided'}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                          <p><span className="font-semibold">Address:</span> {clinic.address || 'Not provided'}</p>
                          <p className="mt-2"><span className="font-semibold">Specialties:</span> {clinic.specialties?.length ? clinic.specialties.join(', ') : 'Not provided'}</p>
                          <p className="mt-2"><span className="font-semibold">License:</span> {clinic.clinicLicenseDocument || 'Not provided'}</p>
                          {clinic.gstNumber ? <p className="mt-2"><span className="font-semibold">GST:</span> {clinic.gstNumber}</p> : null}
                        </div>
                      </div>

                      <ActionPanel
                        busy={actionLoading === clinic.id}
                        onApprove={() => openDecisionModal('clinic', clinic, 'VERIFIED')}
                        onReject={() => openDecisionModal('clinic', clinic, 'REJECTED')}
                        onSuspend={() => openDecisionModal('clinic', clinic, 'SUSPENDED')}
                      />
                    </div>
                  </div>
                ))
              : doctors.map((doctor) => (
                  <div key={doctor.id} className="card">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-text-primary">{doctor.name}</h3>
                          <StatusBadge status={doctor.approvalStatus} />
                          <span className="badge badge-info text-xs">{doctor.doctorProfile?.specialization || 'Specialization not set'}</span>
                        </div>
                        <div className="grid gap-2 text-sm text-text-muted sm:grid-cols-2">
                          <p>Phone: {doctor.mobile}</p>
                          <p>Email: {doctor.email || 'Not provided'}</p>
                          <p>Qualification: {doctor.doctorProfile?.qualification || 'Not provided'}</p>
                          <p>Experience: {doctor.doctorProfile?.experienceYears ?? 0} years</p>
                          <p>Registration: {doctor.doctorProfile?.medicalRegistrationNumber || 'Not provided'}</p>
                          <p>Consultation fee: {doctor.doctorProfile?.consultationFee ? `INR ${doctor.doctorProfile.consultationFee}` : 'Not provided'}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                          <p><span className="font-semibold">Bio:</span> {doctor.doctorProfile?.bio || 'Not provided'}</p>
                          <p className="mt-2"><span className="font-semibold">Languages:</span> {doctor.doctorProfile?.languagesKnown?.length ? doctor.doctorProfile.languagesKnown.join(', ') : 'Not provided'}</p>
                          <p className="mt-2"><span className="font-semibold">Certificates:</span> {doctor.doctorProfile?.certificates?.length ? doctor.doctorProfile.certificates.join(', ') : 'Not provided'}</p>
                        </div>
                      </div>

                      <ActionPanel
                        busy={actionLoading === doctor.id}
                        onApprove={() => openDecisionModal('doctor', doctor, 'VERIFIED')}
                        onReject={() => openDecisionModal('doctor', doctor, 'REJECTED')}
                        onSuspend={() => openDecisionModal('doctor', doctor, 'SUSPENDED')}
                      />
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>

      <Modal isOpen={decisionState.open} onClose={closeDecisionModal} title={ACTION_CONFIG[decisionState.status].title} size="md">
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              {decisionState.entityType === 'clinic'
                ? decisionState.entity?.name
                : decisionState.entity?.name || 'Applicant'}
            </p>
            <p className="mt-1 text-sm text-gray-600">{ACTION_CONFIG[decisionState.status].helper}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason {decisionState.status === 'VERIFIED' ? '(optional)' : '(required)'}</label>
            <textarea
              rows={4}
              value={decisionState.reason}
              onChange={(e) => setDecisionState((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder={
                decisionState.status === 'VERIFIED'
                  ? 'Add an internal note if needed.'
                  : 'Explain why this application is being rejected or suspended.'
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={closeDecisionModal} className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDecision}
              disabled={actionLoading === decisionState.entity?.id}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${ACTION_CONFIG[decisionState.status].accent} disabled:opacity-50`}
            >
              {actionLoading === decisionState.entity?.id ? 'Saving...' : ACTION_CONFIG[decisionState.status].confirmLabel}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

const SummaryCard = ({ label, value, tone }) => (
  <div className={`rounded-2xl px-4 py-3 text-center ${tone}`}>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs font-medium">{label}</p>
  </div>
);

const ActionPanel = ({ busy, onApprove, onReject, onSuspend }) => (
  <div className="flex min-w-[190px] flex-col gap-2">
    <button
      type="button"
      onClick={onApprove}
      disabled={busy}
      className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
    >
      {busy ? 'Working...' : 'Approve'}
    </button>
    <button
      type="button"
      onClick={onReject}
      disabled={busy}
      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
    >
      {busy ? 'Working...' : 'Reject'}
    </button>
    <button
      type="button"
      onClick={onSuspend}
      disabled={busy}
      className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      Suspend
    </button>
  </div>
);

export default ClinicApprovals;
