import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyClinics, getStaff, addStaff, updateStaffStatus } from '../../api/clinic.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const ManageStaff = ({ staffRole = 'DOCTOR' }) => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ mobile: '', name: '', email: '', password: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await getMyClinics();
        const clinicList = res.data.data.clinics || [];
        setClinics(clinicList);
        if (clinicList.length > 0) setSelectedClinic(clinicList[0]);
      } catch (err) {
        toast.error('Failed to load clinics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) fetchStaff();
  }, [selectedClinic]);

  const fetchStaff = async () => {
    if (!selectedClinic) return;
    try {
      const res = await getStaff(selectedClinic.id);
      const allStaff = res.data.data.staff || [];
      setStaff(allStaff.filter((s) => s.role === staffRole));
    } catch (err) {
      toast.error('Failed to load staff');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addStaff(selectedClinic.id, { ...addForm, role: staffRole });
      toast.success(`${staffRole === 'DOCTOR' ? 'Doctor' : 'Receptionist'} added!`);
      setShowAddModal(false);
      setAddForm({ mobile: '', name: '', email: '', password: '' });
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      await updateStaffStatus(selectedClinic.id, staffId, !currentStatus);
      toast.success('Status updated');
      fetchStaff();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const title = staffRole === 'DOCTOR' ? 'Doctors' : 'Receptionists';

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Manage {title}</h1>
          {selectedClinic && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add {staffRole === 'DOCTOR' ? 'Doctor' : 'Receptionist'}
            </button>
          )}
        </div>

        {/* Clinic selector */}
        {clinics.length > 1 && (
          <div className="mb-4">
            <select
              className="input max-w-xs"
              value={selectedClinic?.id || ''}
              onChange={(e) => setSelectedClinic(clinics.find((c) => c.id === e.target.value))}
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : staff.length === 0 ? (
          <EmptyState
            icon={staffRole === 'DOCTOR' ? '👨‍⚕️' : '👩‍💼'}
            title={`No ${title.toLowerCase()} yet`}
            description={`Add ${title.toLowerCase()} to your clinic`}
            action={
              selectedClinic && (
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  Add {staffRole === 'DOCTOR' ? 'Doctor' : 'Receptionist'}
                </button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-bold">
                        {s.user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{s.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-text-muted">{s.user?.mobile}</p>
                      {s.user?.doctorProfile?.specialization && (
                        <p className="text-xs text-primary-600">{s.user.doctorProfile.specialization}</p>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${s.isActive ? 'badge-success' : 'badge-error'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-end">
                  <button
                    onClick={() => handleToggleStatus(s.id, s.isActive)}
                    className={`text-sm ${s.isActive ? 'text-error hover:text-red-700' : 'text-secondary-600 hover:text-secondary-700'}`}
                  >
                    {s.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add ${staffRole === 'DOCTOR' ? 'Doctor' : 'Receptionist'}`}
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="label">Mobile Number *</label>
            <input
              type="tel"
              className="input"
              value={addForm.mobile}
              onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
              placeholder="+91 9876543210"
              required
            />
          </div>
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="Dr. John Doe"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              placeholder="doctor@example.com"
            />
          </div>
          <div>
            <label className="label">Password (for staff login)</label>
            <input
              type="password"
              className="input"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder="Minimum 6 characters"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isAdding}>
              {isAdding ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Add Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default ManageStaff;
