import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { createPrescription, getPrescriptionByAppointment, updatePrescription } from '../../api/prescription.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const FREQUENCY_OPTIONS = ['Once daily', 'Twice daily', 'Thrice daily', 'Every 6 hours', 'Every 8 hours', 'As needed', 'Before meals', 'After meals'];
const DURATION_OPTIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '2 months', '3 months', 'Ongoing'];

const emptyMedicine = () => ({ name: '', dosage: '', frequency: '', duration: '', notes: '' });

const WritePrescription = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [existingRx, setExistingRx] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [instructions, setInstructions] = useState('');
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPrescriptionByAppointment(appointmentId);
        const rx = res.data.data.prescription;
        setExistingRx(rx);
        setDiagnosis(rx.diagnosis || '');
        setMedicines(rx.medicines?.length ? rx.medicines : [emptyMedicine()]);
        setInstructions(rx.instructions || '');
        setRequiresFollowUp(rx.requiresFollowUp || false);
        setFollowUpDate(rx.followUpDate ? rx.followUpDate.split('T')[0] : '');
      } catch {
        // No existing prescription — start fresh
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  const addMedicine = () => setMedicines((m) => [...m, emptyMedicine()]);

  const removeMedicine = (i) =>
    setMedicines((m) => m.filter((_, idx) => idx !== i));

  const updateMedicine = (i, field, value) =>
    setMedicines((m) => m.map((med, idx) => idx === i ? { ...med, [field]: value } : med));

  const handleSave = async () => {
    const validMeds = medicines.filter((m) => m.name.trim());
    if (!diagnosis.trim() && validMeds.length === 0) {
      toast.error('Add at least a diagnosis or one medicine');
      return;
    }
    if (requiresFollowUp && !followUpDate) {
      toast.error('Please set a follow-up date');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        appointmentId,
        diagnosis: diagnosis.trim() || null,
        medicines: validMeds,
        instructions: instructions.trim() || null,
        requiresFollowUp,
        followUpDate: followUpDate || null,
      };

      if (existingRx) {
        await updatePrescription(existingRx.id, payload);
        toast.success('Prescription updated');
      } else {
        await createPrescription(payload);
        toast.success('Prescription saved');
      }
      navigate('/doctor/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setIsSaving(false);
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
      <div className="page-container max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 text-sm"
        >
          ← Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            {existingRx ? 'Edit Prescription' : 'Write Prescription'}
          </h1>
          {existingRx && (
            <span className="badge bg-blue-100 text-blue-700">Editing existing</span>
          )}
        </div>

        {/* Diagnosis */}
        <div className="card mb-4">
          <label className="label">Diagnosis / Chief Complaint</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="e.g. Acute pharyngitis, Hypertension stage 1..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>

        {/* Medicines */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <label className="label mb-0">Medicines</label>
            <button onClick={addMedicine} className="btn-outline text-sm py-1.5 px-3">
              + Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {medicines.map((med, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 relative">
                {medicines.length > 1 && (
                  <button
                    onClick={() => removeMedicine(i)}
                    className="absolute top-3 right-3 text-error hover:text-red-700 text-lg leading-none"
                    aria-label="Remove medicine"
                  >
                    ×
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label text-xs">Medicine Name *</label>
                    <input
                      className="input"
                      placeholder="e.g. Amoxicillin 500mg"
                      value={med.name}
                      onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Dosage</label>
                    <input
                      className="input"
                      placeholder="e.g. 1 tablet"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Frequency</label>
                    <select
                      className="input"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                    >
                      <option value="">Select...</option>
                      {FREQUENCY_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Duration</label>
                    <select
                      className="input"
                      value={med.duration}
                      onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                    >
                      <option value="">Select...</option>
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Notes</label>
                    <input
                      className="input"
                      placeholder="e.g. Take with food"
                      value={med.notes}
                      onChange={(e) => updateMedicine(i, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="card mb-4">
          <label className="label">General Instructions</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="e.g. Rest for 3 days, avoid cold drinks, drink plenty of water..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        {/* Follow-up */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="label mb-0">Requires Follow-up</label>
              <p className="text-xs text-text-muted mt-0.5">
                Patient will be prioritised in the queue on return
              </p>
            </div>
            <button
              onClick={() => setRequiresFollowUp((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                requiresFollowUp ? 'bg-primary-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={requiresFollowUp}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  requiresFollowUp ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {requiresFollowUp && (
            <div className="mt-4">
              <label className="label">Follow-up Date</label>
              <input
                type="date"
                className="input"
                value={followUpDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-outline flex-1 py-3"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex-1 py-3 font-semibold"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" /> Saving...
              </span>
            ) : (
              '💊 Save Prescription'
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WritePrescription;
