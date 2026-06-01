import { useState, useEffect } from 'react';
import { updatePatientProfile } from '../../api/patient.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ALL_STEPS = [
  { id: 1, field: 'name',             title: 'Your Name',         icon: '👤', required: true  },
  { id: 2, field: 'gender',           title: 'Gender',            icon: '⚧',  required: true  },
  { id: 3, field: 'dob',              title: 'Date of Birth',     icon: '🎂', required: true  },
  { id: 4, field: 'city',             title: 'City',              icon: '📍', required: true  },
  { id: 5, field: 'emergencyContact', title: 'Emergency Contact', icon: '🆘', required: true  },
  { id: 6, field: 'medical',          title: 'Medical Details',   icon: '🩺', required: false },
];

const ProfileSetupModal = ({ onComplete, onSkip, existingUser }) => {
  const { user, updateUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill from existing user data (name from registration, profile fields if any)
  const existingName = existingUser?.name || user?.name || '';
  const existingProfile = existingUser?.patientProfile || {};

  const [form, setForm] = useState({
    name:             existingName,
    gender:           existingProfile.gender || '',
    dob:              existingProfile.dob ? existingProfile.dob.split('T')[0] : '',
    city:             existingProfile.city || '',
    emergencyContact: existingProfile.emergencyContact || '',
    bloodGroup:       existingProfile.bloodGroup || '',
    allergies:        existingProfile.allergies || '',
    existingDiseases: existingProfile.existingDiseases || '',
    insuranceProvider:existingProfile.insuranceProvider || '',
  });

  // Filter out steps that are already filled
  const steps = ALL_STEPS.filter((s) => {
    if (s.field === 'name')             return !existingName || existingName.trim().length < 2;
    if (s.field === 'gender')           return !form.gender;
    if (s.field === 'dob')              return !form.dob;
    if (s.field === 'city')             return !form.city;
    if (s.field === 'emergencyContact') return !form.emergencyContact;
    if (s.field === 'medical')          return true; // always show optional step
    return true;
  });

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];
  const totalSteps  = steps.length;

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const canProceed = () => {
    if (!currentStep) return true;
    switch (currentStep.field) {
      case 'name':             return form.name.trim().length >= 2;
      case 'gender':           return !!form.gender;
      case 'dob':              return !!form.dob;
      case 'city':             return form.city.trim().length >= 2;
      case 'emergencyContact': return form.emergencyContact.trim().length >= 10;
      case 'medical':          return true;
      default:                 return true;
    }
  };

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updatePatientProfile({
        name:              form.name.trim() || existingName,
        gender:            form.gender     || undefined,
        dob:               form.dob        || undefined,
        city:              form.city.trim()|| undefined,
        emergencyContact:  form.emergencyContact.trim() || undefined,
        bloodGroup:        form.bloodGroup || undefined,
        allergies:         form.allergies.trim()         || undefined,
        existingDiseases:  form.existingDiseases.trim()  || undefined,
        insuranceProvider: form.insuranceProvider.trim() || undefined,
      });
      updateUser({ name: form.name.trim() || existingName });
      toast.success('Profile saved! You can now book.');
      onComplete(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // If all required fields already filled — save immediately without showing modal
  useEffect(() => {
    const allFilled = existingName.trim().length >= 2 &&
      existingProfile.gender &&
      (existingProfile.dob || existingProfile.age) &&
      existingProfile.city &&
      existingProfile.emergencyContact;

    if (allFilled) {
      // Profile already complete — just call onComplete silently
      onComplete({ user: existingUser });
    }
  }, []);

  if (!currentStep) return null;

  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-blue-500 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white text-xs font-medium opacity-80 uppercase tracking-wider">
                Step {stepIndex + 1} of {totalSteps}
              </p>
              <h2 className="text-white text-xl font-bold mt-0.5">
                {currentStep.icon} {currentStep.title}
              </h2>
            </div>
            {!currentStep.required && (
              <button
                onClick={stepIndex === totalSteps - 1 ? handleSave : handleNext}
                className="text-white text-xs opacity-70 hover:opacity-100 underline"
              >
                Skip
              </button>
            )}
          </div>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-6 min-h-[220px] flex flex-col justify-between">
          <div>
            {currentStep.field === 'name' && (
              <StepName value={form.name} onChange={(v) => set('name', v)} />
            )}
            {currentStep.field === 'gender' && (
              <StepGender value={form.gender} onChange={(v) => set('gender', v)} />
            )}
            {currentStep.field === 'dob' && (
              <StepDob value={form.dob} onChange={(v) => set('dob', v)} />
            )}
            {currentStep.field === 'city' && (
              <StepCity value={form.city} onChange={(v) => set('city', v)} />
            )}
            {currentStep.field === 'emergencyContact' && (
              <StepEmergency value={form.emergencyContact} onChange={(v) => set('emergencyContact', v)} />
            )}
            {currentStep.field === 'medical' && (
              <StepMedical
                bloodGroup={form.bloodGroup}
                allergies={form.allergies}
                existingDiseases={form.existingDiseases}
                insuranceProvider={form.insuranceProvider}
                onChange={set}
              />
            )}
          </div>

          <div className="flex gap-3 mt-6">
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border-2 border-border text-text-muted font-medium hover:border-gray-300 transition-colors"
              >
                ← Back
              </button>
            )}
            {stepIndex < totalSteps - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" /> Saving...
                  </span>
                ) : (
                  '✅ Save & Continue to Booking'
                )}
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-text-muted">
            🔒 Your data is private and only used for appointments
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Step Components ──────────────────────────────────────────────────────────

const StepName = ({ value, onChange }) => (
  <div>
    <p className="text-text-muted text-sm mb-4">
      What should we call you? This appears on your appointment slip.
    </p>
    <input
      autoFocus
      type="text"
      className="input text-lg py-3"
      placeholder="e.g. Rahul Kumar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={60}
    />
    {value.trim().length > 0 && value.trim().length < 2 && (
      <p className="text-xs text-error mt-1">Name must be at least 2 characters</p>
    )}
  </div>
);

const StepGender = ({ value, onChange }) => (
  <div>
    <p className="text-text-muted text-sm mb-4">
      Helps doctors provide better care.
    </p>
    <div className="grid grid-cols-3 gap-3">
      {[
        { val: 'MALE',   label: 'Male',   icon: '👨' },
        { val: 'FEMALE', label: 'Female', icon: '👩' },
        { val: 'OTHER',  label: 'Other',  icon: '🧑' },
      ].map((g) => (
        <button
          key={g.val}
          type="button"
          onClick={() => onChange(g.val)}
          className={`py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
            value === g.val
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-border text-text-muted hover:border-gray-300'
          }`}
        >
          <span className="text-2xl">{g.icon}</span>
          <span className="text-sm font-medium">{g.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const StepDob = ({ value, onChange }) => {
  const maxDate = new Date().toISOString().split('T')[0];
  const minDate = '1900-01-01';
  return (
    <div>
      <p className="text-text-muted text-sm mb-4">
        Used to calculate your age for medical records.
      </p>
      <input
        type="date"
        className="input text-base py-3"
        value={value}
        max={maxDate}
        min={minDate}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <p className="text-sm text-secondary-600 mt-2">
          Age: {Math.floor((new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000))} years
        </p>
      )}
    </div>
  );
};

const StepCity = ({ value, onChange }) => (
  <div>
    <p className="text-text-muted text-sm mb-4">
      Helps us show nearby clinics and doctors.
    </p>
    <input
      autoFocus
      type="text"
      className="input text-lg py-3"
      placeholder="e.g. Bangalore"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={60}
    />
  </div>
);

const StepEmergency = ({ value, onChange }) => (
  <div>
    <p className="text-text-muted text-sm mb-4">
      A contact we can reach in case of emergency during your visit.
    </p>
    <input
      autoFocus
      type="tel"
      className="input text-lg py-3"
      placeholder="+91 9876543210"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={15}
    />
    <p className="text-xs text-text-muted mt-2">
      Enter a family member or friend's number
    </p>
  </div>
);

const StepMedical = ({ bloodGroup, allergies, existingDiseases, insuranceProvider, onChange }) => (
  <div className="space-y-4">
    <p className="text-text-muted text-sm">
      Optional — helps doctors prepare before your visit. You can add these later from your profile.
    </p>
    <div>
      <label className="label text-xs">Blood Group</label>
      <div className="flex flex-wrap gap-2">
        {BLOOD_GROUPS.map((bg) => (
          <button
            key={bg}
            type="button"
            onClick={() => onChange('bloodGroup', bloodGroup === bg ? '' : bg)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              bloodGroup === bg
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-border text-text-muted hover:border-gray-300'
            }`}
          >
            {bg}
          </button>
        ))}
      </div>
    </div>
    <div>
      <label className="label text-xs">Known Allergies</label>
      <input
        className="input"
        placeholder="e.g. Penicillin, Dust"
        value={allergies}
        onChange={(e) => onChange('allergies', e.target.value)}
      />
    </div>
    <div>
      <label className="label text-xs">Existing Conditions</label>
      <input
        className="input"
        placeholder="e.g. Diabetes, Hypertension"
        value={existingDiseases}
        onChange={(e) => onChange('existingDiseases', e.target.value)}
      />
    </div>
  </div>
);

export default ProfileSetupModal;
