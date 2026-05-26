import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAdminClinics, approveClinic } from '../../api/admin.api';
import { createClinic } from '../../api/clinic.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  phone: '',
  address: '',
  city: '',
  openingTime: '09:00',
  closingTime: '18:00',
  description: '',
};

const ClinicApprovals = () => {
  const [clinics, setClinics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      const params = filter === 'pending' ? { verified: false } : filter === 'verified' ? { verified: true } : {};
      const res = await getAdminClinics(params);
      setClinics(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load clinics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClinics(); }, [filter]);

  const handleApprove = async (id, approved) => {
    setActionLoading(id);
    try {
      await approveClinic(id, approved);
      toast.success(`Clinic ${approved ? 'approved' : 'rejected'}`);
      fetchClinics();
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Clinic name is required';
    if (form.openingTime && form.closingTime && form.openingTime >= form.closingTime) {
      errors.closingTime = 'Closing time must be after opening time';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setSubmitting(true);
    try {
      // Strip empty strings so optional fields aren't sent as ''
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '')
      );
      await createClinic(payload);
      toast.success('Clinic created successfully');
      setShowModal(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      fetchClinics();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create clinic';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Clinic Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            <span className="text-lg leading-none">+</span>
            Add Clinic
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'verified'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-border text-text-muted hover:border-primary-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : clinics.length === 0 ? (
          <EmptyState icon="🏥" title="No clinics found" description="No clinics match the current filter" />
        ) : (
          <div className="space-y-4">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{clinic.name}</h3>
                      <span className={`badge ${clinic.isVerified ? 'badge-success' : 'badge-warning'}`}>
                        {clinic.isVerified ? '✓ Verified' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mt-1">📍 {clinic.address}, {clinic.city}</p>
                    <p className="text-sm text-text-muted">
                      Owner: {clinic.owner?.name} ({clinic.owner?.mobile})
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Staff: {clinic._count?.staff || 0} | Appointments: {clinic._count?.appointments || 0}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!clinic.isVerified ? (
                      <button
                        onClick={() => handleApprove(clinic.id, true)}
                        disabled={actionLoading === clinic.id}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        {actionLoading === clinic.id ? <LoadingSpinner size="sm" /> : '✓ Approve'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(clinic.id, false)}
                        disabled={actionLoading === clinic.id}
                        className="btn-danger text-sm py-2 px-3"
                      >
                        {actionLoading === clinic.id ? <LoadingSpinner size="sm" /> : 'Revoke'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Clinic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">Add New Clinic</h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-text-muted transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Clinic Name */}
              <div>
                <label className="label">Clinic Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. City Health Clinic"
                  className={`input w-full ${formErrors.name ? 'border-red-400' : ''}`}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  placeholder="+91XXXXXXXXXX"
                  className="input w-full"
                />
              </div>

              {/* Address */}
              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="Street address"
                  className="input w-full"
                />
              </div>

              {/* City */}
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleFormChange}
                  placeholder="e.g. Bangalore"
                  className="input w-full"
                />
              </div>

              {/* Opening / Closing time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Opening Time</label>
                  <input
                    type="time"
                    name="openingTime"
                    value={form.openingTime}
                    onChange={handleFormChange}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Closing Time</label>
                  <input
                    type="time"
                    name="closingTime"
                    value={form.closingTime}
                    onChange={handleFormChange}
                    className={`input w-full ${formErrors.closingTime ? 'border-red-400' : ''}`}
                  />
                  {formErrors.closingTime && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.closingTime}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Brief description of the clinic..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-outline py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : 'Create Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClinicApprovals;
