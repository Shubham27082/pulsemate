import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { getPatientProfile } from '../../api/patient.api';
import { initiatePayment, verifyPayment } from '../../api/payment.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ProfileSetupModal from './ProfileSetupModal';

/**
 * BookAppointmentModal — Full pay-first booking flow
 *
 * Stage 1 — profile_check  : fetch profile silently
 * Stage 2 — profile_setup  : if incomplete, collect details first
 * Stage 3 — booking_form   : select date / type / symptoms
 * Stage 4 — payment        : Razorpay checkout
 * Stage 5 — success        : confirmed appointment + queue number
 */

const isProfileComplete = (user) => {
  const p = user?.patientProfile;
  return !!(
    user?.name &&
    p?.gender &&
    (p?.dob || p?.age) &&
    (p?.city || p?.address) &&
    p?.emergencyContact
  );
};

// Load Razorpay SDK once
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const BookAppointmentModal = ({ doctor, clinic, defaultType = 'OFFLINE', onClose, onSuccess }) => {
  const [stage, setStage] = useState('profile_check');
  const [patientData, setPatientData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    appointmentType: defaultType,
    appointmentDate: '',
    slotTime: '',
    symptoms: '',
  });

  const today = new Date().toISOString().split('T')[0];
  const fee = doctor.consultationFee || 0;

  // ── Stage 1: check profile ───────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const res = await getPatientProfile();
        const user = res.data.data.user;
        setPatientData(user);
        setStage(isProfileComplete(user) ? 'booking_form' : 'profile_setup');
      } catch {
        setStage('profile_setup');
      }
    };
    check();
  }, []);

  const handleProfileComplete = (data) => {
    setPatientData(data?.user || patientData);
    setStage('booking_form');
  };

  // ── Stage 3 → 4: submit booking form → open Razorpay ────────────────────
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!form.appointmentDate) return toast.error('Please select a date');

    setIsProcessing(true);
    try {
      // Step 1: create pending appointment + order
      const res = await initiatePayment({
        doctorId: doctor.id,
        clinicId: clinic.id,
        appointmentType: form.appointmentType,
        appointmentDate: form.appointmentDate,
        slotTime: form.slotTime || undefined,
        symptoms: form.symptoms || undefined,
      });

      const { appointmentId, order, key, amount, devMode, doctorName } = res.data.data;

      // ── Dev mode: skip Razorpay UI ──────────────────────────────────────
      if (devMode) {
        setStage('payment');
        await handleVerify({
          appointmentId,
          razorpayOrderId: order.id,
          razorpayPaymentId: `pay_dev_${Date.now()}`,
          razorpaySignature: 'dev_sig',
        });
        return;
      }

      // ── Real Razorpay ───────────────────────────────────────────────────
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Check your internet connection.');
        setIsProcessing(false);
        return;
      }

      setStage('payment');

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'PulseMate',
        description: `Consultation — Dr. ${doctorName || doctor.user?.name}`,
        image: '/favicon.ico',
        order_id: order.id,
        handler: async (response) => {
          await handleVerify({
            appointmentId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        prefill: {
          name: patientData?.name || '',
          contact: patientData?.mobile || '',
        },
        notes: { appointmentId },
        theme: { color: '#4F46E5' },
        modal: {
          ondismiss: () => {
            // Payment cancelled by user — go back to booking form
            setStage('booking_form');
            setIsProcessing(false);
            toast('Payment cancelled. Your slot is not confirmed yet.', { icon: '⚠️' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setStage('booking_form');
        setIsProcessing(false);
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  // ── Step 2: verify payment → confirm appointment ─────────────────────────
  const handleVerify = async ({ appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    try {
      const res = await verifyPayment({
        appointmentId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      const { appointment } = res.data.data;
      setStage('success');
      // Pass confirmed appointment back to parent
      setTimeout(() => onSuccess(appointment), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed');
      setStage('booking_form');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (stage === 'profile_check') {
    return (
      <Modal isOpen={true} onClose={onClose} title="Book Appointment">
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-text-muted">Checking your profile...</p>
        </div>
      </Modal>
    );
  }

  if (stage === 'profile_setup') {
    return <ProfileSetupModal onComplete={handleProfileComplete} onSkip={onClose} />;
  }

  if (stage === 'payment') {
    return (
      <Modal isOpen={true} onClose={() => {}} title="Processing Payment">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">💳</span>
          </div>
          <p className="font-semibold text-text-primary">Opening payment gateway...</p>
          <p className="text-sm text-text-muted text-center">
            Complete the payment in the Razorpay window.<br />
            Do not close this tab.
          </p>
          <LoadingSpinner size="sm" />
        </div>
      </Modal>
    );
  }

  if (stage === 'success') {
    return (
      <Modal isOpen={true} onClose={onSuccess} title="">
        <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Booking Confirmed!</h2>
            <p className="text-text-muted mt-1">Payment successful. Your appointment is confirmed.</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 w-full text-left">
            <p className="text-sm font-medium text-green-800">
              🏥 {clinic.name}
            </p>
            <p className="text-sm text-green-700">
              👨‍⚕️ {doctor.user?.name} — {doctor.specialization}
            </p>
            <p className="text-sm text-green-700">
              📅 {new Date(form.appointmentDate).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <p className="text-xs text-text-muted">Redirecting to your appointments...</p>
        </div>
      </Modal>
    );
  }

  // ── Stage: booking_form ──────────────────────────────────────────────────
  const p = patientData?.patientProfile;
  const age = p?.dob
    ? Math.floor((new Date() - new Date(p.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : p?.age;

  return (
    <Modal isOpen={true} onClose={onClose} title="Book Appointment">
      <form onSubmit={handleProceedToPayment} className="space-y-4">

        {/* Doctor info */}
        <div className="bg-primary-50 rounded-xl p-4">
          <p className="font-semibold text-text-primary">{doctor.user?.name}</p>
          <p className="text-sm text-primary-600">{doctor.specialization}</p>
          <p className="text-sm text-text-muted mt-1">📍 {clinic.name}, {clinic.city}</p>
        </div>

        {/* Auto-filled patient details */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 text-sm font-semibold">✓ Patient Details</span>
            <span className="text-xs text-green-500">auto-filled</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-text-muted">Name:</span>
            <span className="font-medium text-text-primary">{patientData?.name}</span>
            <span className="text-text-muted">Gender:</span>
            <span className="font-medium text-text-primary capitalize">{p?.gender?.toLowerCase() || '—'}</span>
            {age && <><span className="text-text-muted">Age:</span><span className="font-medium text-text-primary">{age} yrs</span></>}
            {(p?.city || p?.address) && <><span className="text-text-muted">City:</span><span className="font-medium text-text-primary">{p?.city || p?.address}</span></>}
            {p?.bloodGroup && <><span className="text-text-muted">Blood:</span><span className="font-medium text-text-primary">{p.bloodGroup}</span></>}
            {p?.existingDiseases && (
              <><span className="text-text-muted">Conditions:</span><span className="font-medium text-text-primary col-span-1">{p.existingDiseases}</span></>
            )}
          </div>
        </div>

        {/* Appointment type */}
        <div>
          <label className="label">Appointment Type</label>
          <div className="flex gap-3">
            {['OFFLINE', 'ONLINE'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, appointmentType: type })}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  form.appointmentType === type
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-border text-text-muted hover:border-gray-300'
                }`}
              >
                {type === 'OFFLINE' ? '🏥 In-Person' : '💻 Online'}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="label" htmlFor="appt-date">Appointment Date</label>
          <input
            id="appt-date"
            type="date"
            className="input"
            min={today}
            value={form.appointmentDate}
            onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
            required
          />
        </div>

        {/* Slot time */}
        <div>
          <label className="label" htmlFor="appt-slot">
            Preferred Time <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            id="appt-slot"
            type="time"
            className="input"
            value={form.slotTime}
            onChange={(e) => setForm({ ...form, slotTime: e.target.value })}
          />
        </div>

        {/* Symptoms */}
        <div>
          <label className="label" htmlFor="appt-symptoms">
            Symptoms / Reason <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="appt-symptoms"
            className="input resize-none"
            rows={3}
            placeholder="Describe your symptoms..."
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            maxLength={1000}
          />
        </div>

        {/* Payment summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Booking Fee (Platform)</span>
            <span className="font-semibold text-gray-900">₹10</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Consultation Fee</span>
            <span className="text-gray-400 text-xs italic">Pay at clinic — ₹{fee}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
            <span>Pay Now</span>
            <span className="text-primary-600">₹10</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Consultation fee of ₹{fee} is paid directly at the clinic.
          </p>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3">
          <span className="text-blue-500 mt-0.5">ℹ️</span>
          <p className="text-xs text-blue-700">
            A <strong>₹10 booking fee</strong> is charged to confirm your slot.
            The consultation fee of <strong>₹{fee}</strong> is paid directly at the clinic.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing || !form.appointmentDate}
            className="btn-primary flex-1 py-3 font-semibold disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" /> Processing...
              </span>
            ) : (
              `💳 Pay ₹10 & Confirm Booking`
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookAppointmentModal;
