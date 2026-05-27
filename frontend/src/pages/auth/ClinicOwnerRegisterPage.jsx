import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { registerClinicOwner } from '../../api/auth.api';

const initialForm = {
  ownerName: '',
  phone: '',
  email: '',
  password: '',
  clinicName: '',
  clinicAddress: '',
  city: '',
  state: '',
  pincode: '',
  clinicPhone: '',
  clinicLicenseDocument: '',
  gstNumber: '',
  openingHours: '',
  specialties: '',
};

const ClinicOwnerRegisterPage = () => {
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
      await registerClinicOwner({
        ...form,
        specialties: splitCommaValues(form.specialties),
      });
      toast.success('Clinic application submitted for admin approval');
      navigate('/login/clinic');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit clinic registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Register your clinic</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create your clinic owner account and submit your clinic details for platform approval.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
        <p className="text-sm font-medium text-orange-800">Approval workflow</p>
        <p className="mt-1 text-sm text-orange-700">
          You can sign in after registration, but booking and staff operations stay restricted until a super admin verifies the clinic.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput label="Owner name" value={form.ownerName} onChange={(value) => updateField('ownerName', value)} placeholder="Shubham Gupta" autoFocus />
        <TextInput label="Owner phone number" type="tel" value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="+91 98765 43210" />
        <TextInput label="Email address" type="email" value={form.email} onChange={(value) => updateField('email', value)} placeholder="owner@clinic.com" />
        <TextInput label="Password" type="password" value={form.password} onChange={(value) => updateField('password', value)} placeholder="Create a strong password" />
        <TextInput label="Clinic name" value={form.clinicName} onChange={(value) => updateField('clinicName', value)} placeholder="PulseCare Clinic" />
        <TextArea label="Clinic address" value={form.clinicAddress} onChange={(value) => updateField('clinicAddress', value)} placeholder="123 Main Road, Sector 8" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="City" value={form.city} onChange={(value) => updateField('city', value)} placeholder="Jaipur" />
          <TextInput label="State" value={form.state} onChange={(value) => updateField('state', value)} placeholder="Rajasthan" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Pincode" value={form.pincode} onChange={(value) => updateField('pincode', value)} placeholder="302001" />
          <TextInput label="Clinic phone" type="tel" value={form.clinicPhone} onChange={(value) => updateField('clinicPhone', value)} placeholder="+91 98765 40000" />
        </div>
        <TextInput
          label="Clinic license document"
          value={form.clinicLicenseDocument}
          onChange={(value) => updateField('clinicLicenseDocument', value)}
          placeholder="License number or document URL"
        />
        <TextInput
          label="GST number"
          value={form.gstNumber}
          onChange={(value) => updateField('gstNumber', value)}
          placeholder="Optional"
          required={false}
        />
        <TextInput
          label="Opening hours"
          value={form.openingHours}
          onChange={(value) => updateField('openingHours', value)}
          placeholder="Mon-Sat, 9:00 AM - 7:00 PM"
        />
        <TextInput
          label="Specialties"
          value={form.specialties}
          onChange={(value) => updateField('specialties', value)}
          placeholder="General Medicine, Pediatrics"
          helpText="Separate multiple specialties with commas."
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-orange-600 py-3 font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit clinic application'}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-6 text-center">
        <p className="text-sm text-gray-500">
          Already registered?{' '}
          <Link to="/login/clinic" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

const TextInput = ({ label, helpText, onChange, required = true, ...props }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
    <input
      {...props}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
    {helpText ? <p className="mt-1 text-xs text-gray-500">{helpText}</p> : null}
  </div>
);

const TextArea = ({ label, onChange, ...props }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      {...props}
      rows={3}
      required
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>
);

const splitCommaValues = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default ClinicOwnerRegisterPage;
