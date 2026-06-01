import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getPatientProfile, updatePatientProfile } from '../../api/patient.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Only the fields that truly matter for healthcare
const calcCompletion = (user, p) => {
  const checks = [
    { label: 'Name',              done: !!user?.name,             weight: 25 },
    { label: 'Gender',            done: !!p?.gender,              weight: 20 },
    { label: 'Date of Birth',     done: !!(p?.dob || p?.age),     weight: 20 },
    { label: 'Blood Group',       done: !!p?.bloodGroup,          weight: 15 },
    { label: 'Emergency Contact', done: !!p?.emergencyContact,    weight: 20 },
  ];
  const pct = checks.reduce((s, c) => s + (c.done ? c.weight : 0), 0);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  return { pct, missing };
};

const PatientProfile = () => {
  const { updateUser } = useAuthStore();
  const [profile, setProfile]     = useState(null);
  const [completion, setCompletion] = useState({ pct: 0, missing: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData]   = useState({});

  const loadProfile = async () => {
    try {
      const res = await getPatientProfile();
      const user = res.data.data.user;
      setProfile(user);
      setCompletion(calcCompletion(user, user?.patientProfile));
      const p = user?.patientProfile;
      setFormData({
        name:             user.name || '',
        gender:           p?.gender || '',
        dob:              p?.dob ? p.dob.split('T')[0] : '',
        bloodGroup:       p?.bloodGroup || '',
        emergencyContact: p?.emergencyContact || '',
        allergies:        p?.allergies || '',
        existingDiseases: p?.existingDiseases || '',
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    setIsSaving(true);
    try {
      const res = await updatePatientProfile({
        name:             formData.name || undefined,
        gender:           formData.gender || undefined,
        dob:              formData.dob || undefined,
        bloodGroup:       formData.bloodGroup,        // send empty string so backend can clear it
        emergencyContact: formData.emergencyContact || undefined,
        allergies:        formData.allergies,          // send empty string so backend can clear it
        existingDiseases: formData.existingDiseases,   // send empty string so backend can clear it
      });
      const user = res.data.data.user;
      setProfile(user);
      setCompletion(calcCompletion(user, user?.patientProfile));
      updateUser({ name: user.name });
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const set = (field, val) => setFormData((f) => ({ ...f, [field]: val }));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const p = profile?.patientProfile;
  const age = p?.dob
    ? Math.floor((new Date() - new Date(p.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : p?.age;

  const completionColor =
    completion.pct === 100 ? 'bg-green-500' :
    completion.pct >= 60   ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-outline text-sm py-2 px-4">
              ✏️ Edit
            </button>
          )}
        </div>

        {/* Avatar + name card */}
        <div className="card mb-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-2xl">
              {profile?.name?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-primary truncate">{profile?.name || 'Patient'}</h2>
            <p className="text-text-muted text-sm">{profile?.mobile}</p>
            {age && <p className="text-sm text-text-muted">{age} years • {p?.gender || ''}</p>}
          </div>
          {/* Blood group badge */}
          {p?.bloodGroup && (
            <div className="flex-shrink-0 w-12 h-12 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">{p.bloodGroup}</span>
            </div>
          )}
        </div>

        {/* Completion bar — only show if incomplete */}
        {completion.pct < 100 && (
          <div className="card mb-4 bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-yellow-800">Complete your profile</p>
              <span className="text-sm font-bold text-yellow-700">{completion.pct}%</span>
            </div>
            <div className="w-full bg-yellow-100 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${completionColor}`}
                style={{ width: `${completion.pct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {completion.missing.map((m) => (
                <button
                  key={m}
                  onClick={() => setIsEditing(true)}
                  className="text-xs bg-white border border-yellow-300 text-yellow-700 px-2 py-0.5 rounded-full hover:bg-yellow-50"
                >
                  + {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {isEditing ? (
          /* ── Edit Form ──────────────────────────────────────────── */
          <form onSubmit={handleSave} className="card space-y-5">
            <h3 className="font-semibold text-text-primary">Edit Profile</h3>

            {/* Name */}
            <div>
              <label className="label">Full Name <span className="text-red-500">*</span></label>
              <input
                className="input w-full"
                value={formData.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Your full name"
              />
            </div>

            {/* Gender + DOB */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Gender <span className="text-red-500">*</span></label>
                <select className="input w-full" value={formData.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => set('dob', e.target.value)}
                />
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label className="label">Blood Group <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg} type="button"
                    onClick={() => set('bloodGroup', formData.bloodGroup === bg ? '' : bg)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      formData.bloodGroup === bg
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-border text-text-muted hover:border-gray-300'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="label">Emergency Contact <span className="text-red-500">*</span></label>
              <input
                type="tel"
                className="input w-full"
                value={formData.emergencyContact}
                onChange={(e) => set('emergencyContact', e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            {/* Allergies */}
            <div>
              <label className="label">Known Allergies <span className="text-text-muted font-normal text-xs">(optional)</span></label>
              <input
                className="input w-full"
                value={formData.allergies}
                onChange={(e) => set('allergies', e.target.value)}
                placeholder="e.g. Penicillin, Dust, Peanuts"
              />
            </div>

            {/* Existing Conditions */}
            <div>
              <label className="label">Existing Conditions <span className="text-text-muted font-normal text-xs">(optional)</span></label>
              <input
                className="input w-full"
                value={formData.existingDiseases}
                onChange={(e) => set('existingDiseases', e.target.value)}
                placeholder="e.g. Diabetes, Hypertension"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
                {isSaving ? <LoadingSpinner size="sm" className="mx-auto" /> : '💾 Save'}
              </button>
            </div>
          </form>
        ) : (
          /* ── View Mode ──────────────────────────────────────────── */
          <div className="space-y-3">

            {/* Essential info */}
            <div className="card">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Essential Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Gender"           value={p?.gender} />
                <InfoItem label="Age"              value={age ? `${age} yrs` : null} />
                <InfoItem label="Date of Birth"    value={p?.dob ? new Date(p.dob).toLocaleDateString('en-IN') : null} />
                <InfoItem label="Blood Group"      value={p?.bloodGroup} highlight={!!p?.bloodGroup} />
                <InfoItem label="Emergency Contact" value={p?.emergencyContact} span />
              </div>
            </div>

            {/* Medical info — only show if at least one is filled */}
            {(p?.allergies || p?.existingDiseases) && (
              <div className="card">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Medical Info</h3>
                <div className="grid grid-cols-1 gap-3">
                  {p?.allergies && (
                    <div className="flex items-start gap-3 bg-orange-50 rounded-lg p-3">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Allergies</p>
                        <p className="text-sm text-orange-800 mt-0.5">{p.allergies}</p>
                      </div>
                    </div>
                  )}
                  {p?.existingDiseases && (
                    <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-3">
                      <span className="text-lg">🏥</span>
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Existing Conditions</p>
                        <p className="text-sm text-blue-800 mt-0.5">{p.existingDiseases}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt to fill missing critical fields */}
            {completion.pct < 100 && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full card border-dashed border-2 border-primary-200 text-primary-600 text-sm font-medium py-3 hover:bg-primary-50 transition-colors text-center"
              >
                + Complete your profile ({completion.missing.join(', ')})
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const InfoItem = ({ label, value, span, highlight }) => (
  <div className={span ? 'col-span-2' : ''}>
    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{label}</p>
    {value ? (
      <p className={`mt-0.5 font-medium ${highlight ? 'text-red-600 text-lg' : 'text-text-primary'}`}>
        {value}
      </p>
    ) : (
      <p className="mt-0.5 text-gray-300 text-sm">Not set</p>
    )}
  </div>
);

export default PatientProfile;
