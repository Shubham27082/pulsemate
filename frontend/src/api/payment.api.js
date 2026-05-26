import api from './axios';

// Step 1 — create pending appointment + Razorpay order
export const initiatePayment = (bookingData) =>
  api.post('/payments/initiate', bookingData);

// Step 2 — verify payment + confirm appointment
export const verifyPayment = (data) =>
  api.post('/payments/verify', data);

// Receptionist cash payment
export const markCashPayment = (data) =>
  api.post('/payments/cash', data);

export const getPaymentStatus = (appointmentId) =>
  api.get(`/payments/appointment/${appointmentId}`);

export const getMyPayments = (params) =>
  api.get('/payments/my', { params });
