import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMe } from '../../api/auth.api';
import { getStaff } from '../../api/clinic.api';
import { addFollowUp } from '../../api/reception.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const FollowUpBooking = () => {
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    originalAppointmentId: '',
    doctorId: '',
    symptoms: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await getMe();
        const staffClinics = meRes.data.data.user?.clinicStaff || [];
        if (staffClinics.length === 0) { setIsLoading(false); return; }

        const myClinic = staffClinics[0].clinic;
        setClinic(myClinic);

        const staffRes = await getStaff(myClinic.id);
        const doctorStaff = (staffRes.data.data.staff || []).filter((s) => s.role === 'DOCTOR');
        setDoctors(doctorStaff);

        if (doctorStaff.length > 0) {
          const firstDoctorProfileId = doctorStaff[0].user?.doctorProfile?.id;
          setForm((f) => ({ ...f, doctorId: firstDoctorProfileId || '' }));
        }
      } catch {
        toast.error('Failed to load clinic data');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.originalAppointmentId.trim()) {
      toast.error('Original appointment ID is required');
      return;
    }
    if (!form.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    if (!clinic) {
      toast.error('Clinic not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addFollowUp({
        doctorId: form.doctorId,
        clinicId: clinic.id,
        originalAppointmentId: form.originalAppointmentId.trim(),
        symptoms: form.symptoms.trim() || undefined,
      });

      const { queueNumber } = res.data.data;
      toast.success(`Follow-up patient added with priority — Queue #${queueNumber}`);
      setForm((f) => ({ ...f, originalAppointmentId: '', symptoms: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add follow-up patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Follow-up Return</h1>
        <p className="text-text-muted text-sm mb-6">
          Add a returning patient to the priority queue. They will be placed ahead of new patients.
        </p>

        {/* How it works */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-orange-800 mb-2">⚡ Priority Queue Logic</p>
          <ul className="text-xs text-orange-700 space-y-1">
            <li>• Follow-up patients are placed <strong>before</strong> new waiting patients</li>
            <li>• Multiple follow-ups are served in the order they return</li>
            <li>• Regular queue: 101, 102, 103...</li>
            <li>• With follow-up: <strong>F→ 104</strong>, 101, 102, 103...</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* Doctor selector */}
          <div>
            <label className="label">Doctor</label>
            <select
              className="input"
              value={form.doctorId}
              onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
              required
            >
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.user?.doctorProfile?.id}>
                  {d.user?.name}
                  {d.user?.doctorProfile?.specialization
                    ? ` (${d.user.doctorProfile.specialization})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Original appointment ID */}
          <div>
            <label className="label">Original Appointment ID</label>
            <input
              className="input font-mono text-sm"
              placeholder="Paste the appointment ID from today's visit"
              value={form.originalAppointmentId}
              onChange={(e) => setForm((f) => ({ ...f, originalAppointmentId: e.target.value }))}
              required
            />
            <p className="text-xs text-text-muted mt-1">
              Found on the patient's appointment card or queue slip
            </p>
          </div>

          {/* Reason for return */}
          <div>
            <label className="label">Reason for Return <span className="text-text-muted font-normal">(optional)</span></label>
            <input
              className="input"
              placeholder="e.g. BP check after medication, X-ray result review..."
              value={form.symptoms}
              onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 font-semibold"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" /> Adding to priority queue...
              </span>
            ) : (
              '🔄 Add to Priority Queue'
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default FollowUpBooking;
