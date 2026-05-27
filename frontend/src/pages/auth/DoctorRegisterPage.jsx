import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { registerDoctor } from '../../api/auth.api';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  qualification: '',
  specialization: '',
  experienceYears: '',
  medicalRegistrationNumber: '',
  certificates: '',
  consultationFee: '',
  onlineAvailable: true,
  offlineAvailable: true,
  bio: '',
  languagesKnown: '',
};

const DoctorRegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await registerDoctor({
        ...form,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
        certificates: splitCommaValues(form.certificates),
        languagesKnown: splitCommaValues(form.languagesKnown),
      });
      toast.success('Doctor application submitted for verification');
      navigate('/login/doctor');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit application');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Apply as doctor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create your doctor profile. You can sign in after approval, and your dashboard will stay limited until verification is complete.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
        <p className="text-sm font-medium text-green-800">Verification required</p>
        <p className="mt-1 text-sm text-green-700">
          Approved doctors become visible in the marketplace and can accept clinic invitations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput label="Full name" value={form.fullName} onChange={(value) => updateField('fullName', value)} placeholder="Dr. Pooja Sharma" autoFocus />
        <TextInput label="Phone number" type="tel" value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="+91 98765 43210" />
        <TextInput label="Email address" type="email" value={form.email} onChange={(value) => updateField('email', value)} placeholder="doctor@example.com" />
        <TextInput label="Password" type="password" value={form.password} onChange={(value) => updateField('password', value)} placeholder="Create a strong password" />
        <TextInput label="Qualification" value={form.qualification} onChange={(value) => updateField('qualification', value)} placeholder="MBBS, MD" />
        <TextInput label="Specialization" value={form.specialization} onChange={(value) => updateField('specialization', value)} placeholder="Cardiology" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Experience (years)" type="number" value={form.experienceYears} onChange={(value) => updateField('experienceYears', value)} placeholder="8" />
          <TextInput label="Consultation fee" type="number" value={form.consultationFee} onChange={(value) => updateField('consultationFee', value)} placeholder="700" />
        </div>
        <TextInput
          label="Medical registration number"
          value={form.medicalRegistrationNumber}
          onChange={(value) => updateField('medicalRegistrationNumber', value)}
          placeholder="MCI / state council number"
        />
        <TextInput
          label="Certificates"
          value={form.certificates}
          onChange={(value) => updateField('certificates', value)}
          placeholder="MBBS certificate, MD certificate"
          helpText="Separate multiple entries with commas."
        />
        <TextInput
          label="Languages known"
          value={form.languagesKnown}
          onChange={(value) => updateField('languagesKnown', value)}
          placeholder="English, Hindi"
          helpText="Separate multiple languages with commas."
        />
        <TextArea
          label="Professional bio"
          value={form.bio}
          onChange={(value) => updateField('bio', value)}
          placeholder="Share your practice focus, care style, and areas of expertise."
        />

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
          <p className="text-sm font-medium text-gray-800">Availability</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Checkbox
              label="Available for online consultations"
              checked={form.onlineAvailable}
              onChange={(checked) => updateField('onlineAvailable', checked)}
            />
            <Checkbox
              label="Available for clinic visits"
              checked={form.offlineAvailable}
              onChange={(checked) => updateField('offlineAvailable', checked)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit doctor application'}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-6 text-center">
        <p className="text-sm text-gray-500">
          Already applied?{' '}
          <Link to="/login/doctor" className="font-semibold text-green-600 hover:text-green-700">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

const TextInput = ({ label, helpText, onChange, ...props }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
    <input
      {...props}
      required
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
    />
    {helpText ? <p className="mt-1 text-xs text-gray-500">{helpText}</p> : null}
  </div>
);

const TextArea = ({ label, onChange, ...props }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      {...props}
      rows={4}
      required
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  </div>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
    <span>{label}</span>
  </label>
);

const splitCommaValues = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default DoctorRegisterPage;
