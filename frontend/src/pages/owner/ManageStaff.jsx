import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyClinics, getStaff, getDoctorInvites, addStaff, updateStaffStatus } from '../../api/clinic.api';
import { getMarketplaceDoctors, inviteDoctorToClinic } from '../../api/marketplace.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const ManageStaff = ({ staffRole = 'DOCTOR' }) => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ mobile: '', name: '', email: '', password: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [marketplaceDoctors, setMarketplaceDoctors] = useState([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(null);
  const [doctorInvites, setDoctorInvites] = useState([]);
  const [marketplaceFilters, setMarketplaceFilters] = useState({
    specialization: '',
    city: '',
    experienceYears: '',
  });

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

  useEffect(() => {
    if (selectedClinic && staffRole === 'DOCTOR') {
      fetchDoctorInvites();
    }
  }, [selectedClinic, staffRole]);

  useEffect(() => {
    if (staffRole === 'DOCTOR') {
      fetchMarketplaceDoctors();
    }
  }, [staffRole]);

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

  const fetchDoctorInvites = async () => {
    if (!selectedClinic || staffRole !== 'DOCTOR') return;
    try {
      const res = await getDoctorInvites(selectedClinic.id);
      setDoctorInvites(res.data.data?.invites || []);
    } catch (_) {
      toast.error('Failed to load doctor invites');
    }
  };

  const fetchMarketplaceDoctors = async () => {
    setMarketplaceLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(marketplaceFilters).filter(([, value]) => value !== '')
      );
      const res = await getMarketplaceDoctors(params);
      setMarketplaceDoctors(res.data.data?.doctors || []);
    } catch (_) {
      toast.error('Failed to load marketplace doctors');
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const handleMarketplaceSearch = async (e) => {
    e.preventDefault();
    fetchMarketplaceDoctors();
  };

  const handleInviteDoctor = async (doctorId, doctorFee) => {
    if (!selectedClinic) {
      toast.error('Select a clinic first');
      return;
    }

    setInviteLoading(doctorId);
    try {
      await inviteDoctorToClinic(doctorId, {
        clinicId: selectedClinic.id,
        consultationFee: doctorFee,
      });
      toast.success('Doctor invitation sent');
      fetchDoctorInvites();
      fetchMarketplaceDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(null);
    }
  };

  const title = staffRole === 'DOCTOR' ? 'Doctors' : 'Receptionists';
  const connectedDoctorUserIds = new Set(staff.map((member) => member.user?.id).filter(Boolean));
  const inviteStatusByDoctorId = new Map(
    doctorInvites
      .filter((invite) => invite.removedAt === null || invite.inviteStatus !== 'REMOVED')
      .map((invite) => [invite.doctorId, invite])
  );

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

        {staffRole === 'DOCTOR' && (
          <div className="card mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Doctor Marketplace</h2>
                <p className="mt-1 text-sm text-text-muted">Search verified doctors, review their current clinic presence, and send invitations to your clinic.</p>
              </div>
              <form onSubmit={handleMarketplaceSearch} className="grid gap-3 sm:grid-cols-4">
                <input
                  type="text"
                  className="input"
                  placeholder="Specialization"
                  value={marketplaceFilters.specialization}
                  onChange={(e) => setMarketplaceFilters((prev) => ({ ...prev, specialization: e.target.value }))}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="City"
                  value={marketplaceFilters.city}
                  onChange={(e) => setMarketplaceFilters((prev) => ({ ...prev, city: e.target.value }))}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Min years"
                  value={marketplaceFilters.experienceYears}
                  onChange={(e) => setMarketplaceFilters((prev) => ({ ...prev, experienceYears: e.target.value }))}
                  min={0}
                />
                <button type="submit" className="btn-primary">Search</button>
              </form>
            </div>

            <div className="mt-5">
              {marketplaceLoading ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : marketplaceDoctors.length === 0 ? (
                <EmptyState
                  icon="🩺"
                  title="No marketplace doctors found"
                  description="Try adjusting the filters or wait for more approved doctors."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {marketplaceDoctors.map((doctor) => {
                    const isConnected = connectedDoctorUserIds.has(doctor.user?.id);
                    const existingInvite = inviteStatusByDoctorId.get(doctor.id);
                    const pendingInvite = existingInvite?.inviteStatus === 'PENDING';

                    return (
                      <div key={doctor.id} className="rounded-2xl border border-border bg-white p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-text-primary">{doctor.user?.name}</h3>
                              <span className="badge badge-info text-xs">{doctor.specialization || 'General'}</span>
                            </div>
                            <p className="mt-1 text-sm text-text-muted">{doctor.qualification || 'Qualification not provided'}</p>
                            <p className="text-sm text-text-muted">{doctor.user?.mobile}{doctor.user?.email ? ` · ${doctor.user.email}` : ''}</p>
                          </div>
                          <StatusBadge status="VERIFIED" />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-text-muted">
                          <p>Experience: <span className="font-medium text-text-primary">{doctor.experienceYears ?? 0} yrs</span></p>
                          <p>Fee: <span className="font-medium text-text-primary">₹{doctor.consultationFee ?? 0}</span></p>
                          <p>Online: <span className="font-medium text-text-primary">{doctor.onlineAvailable ? 'Yes' : 'No'}</span></p>
                          <p>Offline: <span className="font-medium text-text-primary">{doctor.offlineAvailable ? 'Yes' : 'No'}</span></p>
                        </div>

                        {doctor.bio ? (
                          <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{doctor.bio}</p>
                        ) : null}

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Current clinics</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {doctor.doctorClinics?.length
                              ? doctor.doctorClinics.map((clinicLink) => (
                                  <span key={clinicLink.id} className="badge badge-gray text-xs">
                                    {clinicLink.clinic?.name}{clinicLink.clinic?.city ? ` · ${clinicLink.clinic.city}` : ''}
                                  </span>
                                ))
                              : <span className="text-sm text-text-muted">No active clinic associations yet</span>}
                          </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                          <div className="flex items-center gap-3">
                            {existingInvite ? <StatusBadge status={existingInvite.inviteStatus} /> : null}
                            <button
                              type="button"
                              onClick={() => handleInviteDoctor(doctor.id, doctor.consultationFee)}
                              disabled={!selectedClinic || isConnected || pendingInvite || inviteLoading === doctor.id}
                              className="btn-primary min-w-[150px] disabled:opacity-50"
                            >
                              {inviteLoading === doctor.id
                                ? 'Sending...'
                                : isConnected
                                  ? 'Already on clinic'
                                  : pendingInvite
                                    ? 'Invite pending'
                                    : existingInvite?.inviteStatus === 'REJECTED'
                                      ? 'Re-invite doctor'
                                      : existingInvite?.inviteStatus === 'REMOVED'
                                        ? 'Invite again'
                                        : 'Send invite'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

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
          <div className="space-y-6">
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
                        {s.inviteStatus && staffRole === 'DOCTOR' && (
                          <div className="mt-1"><StatusBadge status={s.inviteStatus} /></div>
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

            {staffRole === 'DOCTOR' && doctorInvites.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Invite Activity</h2>
                  <span className="badge badge-info text-xs">{doctorInvites.length} invites</span>
                </div>
                <div className="space-y-3">
                  {doctorInvites.map((invite) => (
                    <div key={invite.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text-primary">{invite.doctor?.user?.name || 'Doctor'}</p>
                          <StatusBadge status={invite.inviteStatus} />
                        </div>
                        <p className="mt-1 text-sm text-text-muted">
                          {invite.doctor?.specialization || 'Specialization not set'}
                          {invite.doctor?.user?.mobile ? ` · ${invite.doctor.user.mobile}` : ''}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Fee: ₹{invite.consultationFee ?? 0}
                          {invite.joinedAt ? ` · Joined ${new Date(invite.joinedAt).toLocaleDateString('en-IN')}` : ''}
                          {invite.removedAt ? ` · Removed ${new Date(invite.removedAt).toLocaleDateString('en-IN')}` : ''}
                        </p>
                      </div>
                      <div className="text-xs text-text-muted">
                        Sent {new Date(invite.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
