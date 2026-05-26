import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAppointmentDetails } from '../../api/patient.api';
import { initiatePayment, verifyPayment, getPaymentStatus } from '../../api/payment.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, payRes] = await Promise.all([
          getAppointmentDetails(appointmentId),
          getPaymentStatus(appointmentId),
        ]);
        setAppointment(apptRes.data.data.appointment);
        setPayment(payRes.data.data.payment);
      } catch {
        toast.error('Failed to load payment details');
        navigate('/patient/appointments');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [appointmentId, navigate]);

  const handleRazorpayPayment = async () => {
    setIsPaying(true);
    try {
      const orderRes = await initiatePayment(appointmentId);
      const { order, key, amount, devMode } = orderRes.data.data;

      // Dev mode: skip Razorpay SDK, auto-verify
      if (devMode) {
        await verifyPayment({
          appointmentId,
          razorpayOrderId: order.id,
          razorpayPaymentId: 'dev_pay_' + Date.now(),
          razorpaySignature: 'dev_sig',
        });
        toast.success('Payment successful (dev mode)');
        navigate('/patient/appointments');
        return;
      }

      // Load Razorpay SDK dynamically
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'PulseMate',
        description: `Consultation with Dr. ${appointment?.doctor?.user?.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await verifyPayment({
              appointmentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            navigate('/patient/appointments');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: appointment?.patient?.name || '',
        },
        theme: { color: '#6366F1' },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            toast('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setIsPaying(false);
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

  const fee = 10; // Fixed ₹10 booking fee
  const isPaid = payment?.status === 'PAID';

  return (
    <DashboardLayout>
      <div className="page-container max-w-lg">
        <button
          onClick={() => navigate('/patient/appointments')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 text-sm"
        >
          ← Back to appointments
        </button>

        <h1 className="text-2xl font-bold text-text-primary mb-6">Payment</h1>

        {/* Appointment summary */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-bold text-xl">
                {appointment?.doctor?.user?.name?.charAt(0) || 'D'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">
                Dr. {appointment?.doctor?.user?.name}
              </p>
              <p className="text-sm text-primary-600">{appointment?.doctor?.specialization}</p>
              <p className="text-sm text-text-muted">{appointment?.clinic?.name}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-muted">Date</p>
              <p className="font-medium">
                {new Date(appointment?.appointmentDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Type</p>
              <p className="font-medium">{appointment?.appointmentType}</p>
            </div>
            {appointment?.queueNumber && (
              <div>
                <p className="text-text-muted">Queue #</p>
                <p className="font-medium">{appointment.queueNumber}</p>
              </div>
            )}
            <div>
              <p className="text-text-muted">Status</p>
              <StatusBadge status={appointment?.status} />
            </div>
          </div>
        </div>

        {/* Payment summary */}
        <div className="card mb-6">
          <h2 className="font-semibold text-text-primary mb-4">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Booking Fee (Platform)</span>
              <span className="font-semibold text-gray-900">₹10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Consultation Fee</span>
              <span className="text-gray-400 italic text-xs">Pay at clinic — ₹{appointment?.doctor?.consultationFee || 0}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
              <span>Pay Now</span>
              <span className="text-primary-600">₹10</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Consultation fee is paid directly at the clinic after your visit.
          </p>
        </div>

        {/* Payment status / action */}
        {isPaid ? (
          <div className="card bg-green-50 border-green-200 text-center py-6">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold text-green-800 text-lg">Payment Completed</p>
            <p className="text-sm text-green-600 mt-1">
              Paid via {payment.method} on{' '}
              {new Date(payment.paidAt).toLocaleDateString('en-IN')}
            </p>
            {payment.razorpayPaymentId && !payment.razorpayPaymentId.startsWith('dev_') && (
              <p className="text-xs text-green-500 mt-1">
                Transaction ID: {payment.razorpayPaymentId}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleRazorpayPayment}
              disabled={isPaying || fee === 0}
              className="btn-primary w-full py-4 text-base font-semibold"
            >
              {isPaying ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> Processing...
                </span>
              ) : fee === 0 ? (
                'No payment required'
              ) : (
                `💳 Pay ₹${fee} via Razorpay`
              )}
            </button>
            <p className="text-xs text-center text-text-muted">
              Secured by Razorpay • UPI, Cards, Net Banking accepted
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
