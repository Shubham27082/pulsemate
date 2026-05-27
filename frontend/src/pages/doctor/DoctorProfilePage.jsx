import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getDoctorProfile, updateDoctorProfile, updateAvailability } from '../../api/doctor.api';
import { getMyDoctorInvitations, respondToDoctorInvitation } from '../../api/marketplace.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const SPECIALIZATIONS = [
  'Cardiologist', 'General Physician', 'Dermatologist', 'Orthopedic',
  'Pediatrician', 'Gynecologist', 'Neurologist', 'Psychiatrist', 'ENT',
  'Ophthalmologist', 'Dentist', 'Urologist', 'Gastroenterologist', 'Other',
];

const DoctorProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [invitations, setInvitations] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, invitesRes] = await Promise.all([
          getDoctorProfile(),
          getMyDoctorInvitations(),
        ]);
        const prof = profileRes.data.data.profile;
        setProfile(prof);
        setInvitations(invitesRes.data.data?.invitations || []);
        setFormData({
          specialization: prof.specialization || '',
          experienceYears: prof.experienceYears || 0,
          education: prof.education || '',
          consultationFee: prof.consultationFee || 0,
          bio: prof.bio || '',
          avgConsultationMins: prof.avgConsultationMins || 10,
          onlineAvailable: prof.onlineAvailable || false,
          offlineAvailable: prof.offlineAvailable || true,
        });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInvitationAction = async (inviteId, action) => {
    setInviteLoading(inviteId);
    try {
      await respondToDoctorInvitation(inviteId, action);
      toast.success(
        action === 'ACCEPT'
          ? 'Invitation accepted'
          : action === 'REJECT'
            ? 'Invitation rejected'
            : 'You left the clinic'
      );
      const [profileRes, invitesRes] = await Promise.all([
        getDoctorProfile(),
        getMyDoctorInvitations(),
      ]);
      setProfile(profileRes.data.data.profile);
      setInvitations(invitesRes.data.data?.invitations || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update invitation');
    } finally {
      setInviteLoading(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoctorProfile(formData);
      await updateAvailability({
        onlineAvailable: formData.onlineAvailable,
        offlineAvailable: formData.offlineAvailable,
      });
      // Refresh
      const res = await getDoctorProfile();
      setProfile(res.data.data.profile);
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-outline">Edit Profile</button>
          )}
        </div>

        {/* Header card */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
              <span className="text-primary-700 font-bold text-2xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{user?.name}</h2>
              <p className="text-primary-600 font-medium">{profile?.specialization || 'Doctor'}</p>
              <p className="text-sm text-text-muted">{user?.mobile}</p>
            </div>
          </div>

          {/* Availability badges */}
          <div className="flex gap-2 mt-4">
            <span className={`badge ${profile?.offlineAvailable ? 'badge-success' : 'badge-gray'}`}>
              {profile?.offlineAvailable ? '✓' : '✗'} Offline
            </span>
            <span className={`badge ${profile?.onlineAvailable ? 'badge-info' : 'badge-gray'}`}>
              {profile?.onlineAvailable ? '✓' : '✗'} Online
            </span>
          </div>
        </div>

        {/* Clinics */}
        {profile?.doctorClinics?.length > 0 && (
          <div className="card mb-6">
            <h3 className="font-semibold text-text-primary mb-3">Associated Clinics</h3>
            <div className="space-y-2">
              {profile.doctorClinics.map((dc) => (
                <div key={dc.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-text-primary text-sm">{dc.clinic?.name}</p>
                    <p className="text-xs text-text-muted">{dc.clinic?.city}</p>
                  </div>
                  <div className="text-right text-xs text-text-muted">
                    <p>₹{dc.consultationFee}</p>
                    <p>{dc.startTime} – {dc.endTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Clinic Invitations</h3>
            <span className="badge badge-info text-xs">{invitations.length} total</span>
          </div>

          {invitations.length === 0 ? (
            <p className="text-sm text-text-muted">No clinic invitations yet. Approved clinics will appear here once they invite you.</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div key={invite.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text-primary">{invite.clinic?.name}</p>
                        <StatusBadge status={invite.inviteStatus} />
                      </div>
                      <p className="mt-1 text-sm text-text-muted">
                        {[invite.clinic?.city, invite.clinic?.state].filter(Boolean).join(', ') || 'Location unavailable'}
                      </p>
                      <p className="text-sm text-text-muted">
                        Fee: ₹{invite.consultationFee ?? 0}
                        {invite.startTime && invite.endTime ? ` · ${invite.startTime} - ${invite.endTime}` : ''}
                      </p>
                      {invite.availableDays?.length ? (
                        <p className="text-xs text-text-muted mt-1">Days: {invite.availableDays.join(', ')}</p>
                      ) : null}
                    </div>
                    {invite.inviteStatus === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleInvitationAction(invite.id, 'REJECT')}
                          disabled={inviteLoading === invite.id}
                          className="btn-outline text-sm py-2 px-3"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInvitationAction(invite.id, 'ACCEPT')}
                          disabled={inviteLoading === invite.id}
                          className="btn-primary text-sm py-2 px-3"
                        >
                          {inviteLoading === invite.id ? 'Saving...' : 'Accept'}
                        </button>
                      </div>
                    ) : invite.inviteStatus === 'ACCEPTED' ? (
                      <button
                        type="button"
                        onClick={() => handleInvitationAction(invite.id, 'LEAVE')}
                        disabled={inviteLoading === invite.id}
                        className="btn-outline text-sm py-2 px-3 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {inviteLoading === invite.id ? 'Saving...' : 'Leave clinic'}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile form */}
        <div className="card">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Specialization</label>
                  <select
                    className="input"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  >
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Experience (years)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Avg. Consultation (min)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.avgConsultationMins}
                    onChange={(e) => setFormData({ ...formData, avgConsultationMins: parseInt(e.target.value) || 10 })}
                    min={1}
                    max={60}
                  />
                </div>
              </div>
              <div>
                <label className="label">Education / Qualifications</label>
                <input
                  type="text"
                  className="input"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="MBBS, MD - Cardiology, AIIMS"
                />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief professional bio..."
                />
              </div>
              {/* Availability toggles */}
              <div>
                <label className="label">Availability</label>
                <div className="flex gap-4">
                  {[
                    { key: 'offlineAvailable', label: '🏥 Offline / In-Person' },
                    { key: 'onlineAvailable', label: '💻 Online' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="text-sm text-text-primary">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Specialization', value: profile?.specialization || '—' },
                { label: 'Experience', value: profile?.experienceYears ? `${profile.experienceYears} years` : '—' },
                { label: 'Consultation Fee', value: profile?.consultationFee ? `₹${profile.consultationFee}` : '—' },
                { label: 'Avg. Consultation', value: profile?.avgConsultationMins ? `${profile.avgConsultationMins} min` : '—' },
                { label: 'Education', value: profile?.education || '—' },
                { label: 'Bio', value: profile?.bio || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-text-primary mt-0.5 text-sm">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfilePage;
