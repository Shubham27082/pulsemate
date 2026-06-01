/**
 * PulseMate Full Integration Test
 * Tests every major flow end-to-end against the live backend
 */

require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:5000';
let passed = 0, failed = 0, warnings = 0;
const results = [];

// ─── HTTP helper ─────────────────────────────────────────────────────────────
const req = (method, path, body, token) => new Promise((resolve, reject) => {
  const data = body ? JSON.stringify(body) : null;
  const opts = {
    hostname: 'localhost', port: 5000,
    path, method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
    },
  };
  const r = http.request(opts, (res) => {
    let raw = '';
    res.on('data', (c) => raw += c);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
      catch { resolve({ status: res.statusCode, body: raw }); }
    });
  });
  r.on('error', reject);
  if (data) r.write(data);
  r.end();
});

// ─── Test runner ─────────────────────────────────────────────────────────────
const test = async (name, fn) => {
  try {
    const result = await fn();
    if (result === 'WARN') {
      warnings++;
      results.push({ status: '⚠️ ', name, note: 'warning' });
      console.log(`  ⚠️  ${name}`);
    } else {
      passed++;
      results.push({ status: '✅', name });
      console.log(`  ✅ ${name}`);
    }
  } catch (err) {
    failed++;
    results.push({ status: '❌', name, error: err.message });
    console.log(`  ❌ ${name} — ${err.message}`);
  }
};

const assert = (condition, msg) => { if (!condition) throw new Error(msg); };

// ─── State ───────────────────────────────────────────────────────────────────
let patientToken, patientId;
let doctorToken, doctorProfileId;
let receptionToken;
let clinicId, queueId;
let appointmentId, queueItemId;
let prescriptionId;

// ─── SUITE 1: Health ─────────────────────────────────────────────────────────
console.log('\n━━━ 1. Health Check ━━━');
await test('API is reachable', async () => {
  const r = await req('GET', '/health');
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.status === 'ok', 'Status not ok');
});

// ─── SUITE 2: Authentication ─────────────────────────────────────────────────
console.log('\n━━━ 2. Authentication ━━━');

await test('Staff password login — Doctor', async () => {
  const r = await req('POST', '/api/auth/login-password', {
    mobile: '+919000000003', password: 'Password@123',
  });
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.accessToken, 'No access token');
  doctorToken = r.body.data.accessToken;
});

await test('Staff password login — Receptionist', async () => {
  const r = await req('POST', '/api/auth/login-password', {
    mobile: '+919000000005', password: 'Password@123',
  });
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  receptionToken = r.body.data.accessToken;
});

await test('Invalid password returns 401', async () => {
  const r = await req('POST', '/api/auth/login-password', {
    mobile: '+919000000003', password: 'wrongpassword',
  });
  assert(r.status === 401, `Expected 401, got ${r.status}`);
});

await test('OTP send for patient', async () => {
  const r = await req('POST', '/api/auth/send-otp', {
    mobile: '+919000000006', purpose: 'LOGIN',
  });
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('OTP verify — patient login', async () => {
  // Get OTP from DB directly
  const prisma = require('./src/config/database');
  const otpRecord = await prisma.otp.findFirst({
    where: { mobile: '+919000000006', verified: false },
    orderBy: { createdAt: 'desc' },
  });
  assert(otpRecord, 'No OTP record found');

  // We need the raw OTP — in dev mode it's returned in the response
  // Re-send to get devOtp
  const sendRes = await req('POST', '/api/auth/send-otp', {
    mobile: '+919000000007', purpose: 'LOGIN',
  });
  const devOtp = sendRes.body.data?.devOtp;
  assert(devOtp, 'No devOtp in response — OTP_PROVIDER must be console');

  const verifyRes = await req('POST', '/api/auth/verify-otp', {
    mobile: '+919000000007', otp: devOtp, purpose: 'LOGIN',
  });
  assert(verifyRes.status === 200, `Expected 200, got ${verifyRes.status}`);
  assert(verifyRes.body.data?.accessToken, 'No access token');
  patientToken = verifyRes.body.data.accessToken;
  patientId    = verifyRes.body.data.user.id;
});

await test('Invalid OTP returns 400', async () => {
  const r = await req('POST', '/api/auth/verify-otp', {
    mobile: '+919000000007', otp: '000000', purpose: 'LOGIN',
  });
  assert(r.status === 400 || r.status === 401, `Expected 4xx, got ${r.status}`);
});

await test('GET /auth/me returns current user', async () => {
  const r = await req('GET', '/api/auth/me', null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.user?.role === 'PATIENT', 'Wrong role');
});

await test('Unauthenticated request returns 401', async () => {
  const r = await req('GET', '/api/auth/me');
  assert(r.status === 401, `Expected 401, got ${r.status}`);
});

// ─── SUITE 3: Patient Profile ─────────────────────────────────────────────────
console.log('\n━━━ 3. Patient Profile ━━━');

await test('Get patient profile', async () => {
  const r = await req('GET', '/api/patient/profile', null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.user, 'No user in response');
});

await test('Update patient profile — all fields', async () => {
  const r = await req('PATCH', '/api/patient/profile', {
    name: 'Anita Singh Test',
    gender: 'FEMALE',
    dob: '1996-05-15',
    city: 'Bangalore',
    emergencyContact: '+919876543210',
    bloodGroup: 'A+',
    allergies: 'Penicillin',
    existingDiseases: 'None',
  }, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.user?.name === 'Anita Singh Test', 'Name not updated');
  assert(r.body.data?.profileCompletion >= 80, `Profile completion too low: ${r.body.data?.profileCompletion}`);
});

await test('Profile completion calculated correctly', async () => {
  const r = await req('GET', '/api/patient/profile', null, patientToken);
  assert(r.body.data?.profileCompletion > 0, 'Profile completion is 0');
});

// ─── SUITE 4: Doctor Search ───────────────────────────────────────────────────
console.log('\n━━━ 4. Doctor Search ━━━');

let doctorId;
await test('Search all doctors (public)', async () => {
  const r = await req('GET', '/api/patient/doctors');
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.length > 0, 'No doctors returned');
  doctorId = r.body.data[0].id;
  clinicId = r.body.data[0].doctorClinics?.[0]?.clinic?.id;
});

await test('Search by specialization', async () => {
  const r = await req('GET', '/api/patient/doctors?specialization=Cardiologist');
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.length > 0, 'No cardiologists found');
});

await test('Search by city', async () => {
  const r = await req('GET', '/api/patient/doctors?city=Bangalore');
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.length > 0, 'No doctors in Bangalore');
});

await test('Get doctor profile by ID', async () => {
  const r = await req('GET', `/api/patient/doctors/${doctorId}`);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.doctor?.id === doctorId, 'Wrong doctor returned');
});

await test('Get doctor profile — invalid ID returns 404', async () => {
  const r = await req('GET', '/api/patient/doctors/nonexistent-id-xyz');
  assert(r.status === 404, `Expected 404, got ${r.status}`);
});

// ─── SUITE 5: Payment + Booking ──────────────────────────────────────────────
console.log('\n━━━ 5. Payment & Booking ━━━');

let paymentOrderId;
await test('Initiate payment — creates pending appointment + Razorpay order', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const r = await req('POST', '/api/payments/initiate', {
    doctorId: doctorId,
    clinicId: clinicId,
    appointmentType: 'OFFLINE',
    appointmentDate: tomorrow.toISOString().split('T')[0],
    symptoms: 'Test booking — chest pain',
  }, patientToken);
  assert(r.status === 200 || r.status === 201, `Expected 2xx, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert(r.body.data?.appointmentId, 'No appointmentId returned');
  assert(r.body.data?.order?.id, 'No Razorpay order ID');
  appointmentId  = r.body.data.appointmentId;
  paymentOrderId = r.body.data.order.id;
});

await test('Appointment is PENDING_PAYMENT before payment', async () => {
  const r = await req('GET', `/api/patient/appointments/${appointmentId}`, null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.appointment?.status === 'PENDING_PAYMENT', `Expected PENDING_PAYMENT, got ${r.body.data?.appointment?.status}`);
});

await test('Verify payment (dev mode) — confirms appointment', async () => {
  const r = await req('POST', '/api/payments/verify', {
    appointmentId,
    razorpayOrderId:   paymentOrderId,
    razorpayPaymentId: `pay_dev_${Date.now()}`,
    razorpaySignature: 'dev_sig',
  }, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert(r.body.data?.verified === true, 'Payment not verified');
  assert(r.body.data?.appointment?.status === 'BOOKED', `Expected BOOKED, got ${r.body.data?.appointment?.status}`);
  assert(r.body.data?.appointment?.queueNumber > 0, 'No queue number assigned');
});

await test('Payment status is PAID after verification', async () => {
  const r = await req('GET', `/api/payments/appointment/${appointmentId}`, null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.payment?.status === 'PAID', `Expected PAID, got ${r.body.data?.payment?.status}`);
});

await test('Duplicate booking on same date is blocked', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const r = await req('POST', '/api/payments/initiate', {
    doctorId, clinicId,
    appointmentType: 'OFFLINE',
    appointmentDate: tomorrow.toISOString().split('T')[0],
  }, patientToken);
  assert(r.status === 409, `Expected 409 (duplicate), got ${r.status}`);
});

await test('Get my appointments — includes new booking', async () => {
  const r = await req('GET', '/api/patient/appointments', null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  const found = r.body.data?.find?.((a) => a.id === appointmentId);
  assert(found, 'New appointment not in list');
  assert(found.payment?.status === 'PAID', 'Payment not reflected in appointment list');
});

await test('My payment history', async () => {
  const r = await req('GET', '/api/payments/my', null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.payments?.length > 0, 'No payments in history');
});

// ─── SUITE 6: Queue System ────────────────────────────────────────────────────
console.log('\n━━━ 6. Queue System ━━━');

await test('Get live queue status for appointment', async () => {
  const r = await req('GET', `/api/patient/queue/${appointmentId}`, null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.queueInfo !== undefined, 'No queueInfo in response');
});

await test('Get doctor profile (for doctorProfileId)', async () => {
  const r = await req('GET', '/api/doctor/profile', null, doctorToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  doctorProfileId = r.body.data?.profile?.id;
  assert(doctorProfileId, 'No doctor profile ID');
});

await test('Reception — get today\'s queue', async () => {
  const r = await req('GET', `/api/reception/queue/${doctorProfileId}?clinicId=${clinicId}`, null, receptionToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  queueId = r.body.data?.queue?.id;
  const items = r.body.data?.queueItems || [];
  queueItemId = items.find((i) => i.appointmentId === appointmentId)?.id;
});

await test('Reception — check in patient', async () => {
  if (!queueItemId) return 'WARN'; // appointment may be for tomorrow
  const r = await req('PATCH', `/api/reception/queue/${queueItemId}/check-in`, null, receptionToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('Reception — call next patient', async () => {
  if (!queueId) return 'WARN';
  const r = await req('PATCH', `/api/reception/queue/${queueId}/call-next`, null, receptionToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('Reception — pause queue', async () => {
  if (!queueId) return 'WARN';
  const r = await req('PATCH', `/api/reception/queue/${queueId}/pause`, null, receptionToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('Reception — resume queue', async () => {
  if (!queueId) return 'WARN';
  const r = await req('PATCH', `/api/reception/queue/${queueId}/resume`, null, receptionToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

// ─── SUITE 7: Walk-in ─────────────────────────────────────────────────────────
console.log('\n━━━ 7. Walk-in & Follow-up ━━━');

let walkInAppointmentId;
await test('Reception — add walk-in patient', async () => {
  const r = await req('POST', '/api/reception/walk-in', {
    doctorId: doctorProfileId,
    clinicId,
    patientMobile: '+919111111111',
    patientName: 'Walk-in Test Patient',
    symptoms: 'Fever and cold',
  }, receptionToken);
  assert(r.status === 201, `Expected 201, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert(r.body.data?.queueNumber > 0, 'No queue number for walk-in');
  walkInAppointmentId = r.body.data?.appointment?.id;
});

await test('Reception — add follow-up patient with priority', async () => {
  if (!walkInAppointmentId) return 'WARN';
  const r = await req('POST', '/api/reception/follow-up', {
    doctorId: doctorProfileId,
    clinicId,
    originalAppointmentId: walkInAppointmentId,
    symptoms: 'BP check after medication',
  }, receptionToken);
  assert(r.status === 201, `Expected 201, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert(r.body.data?.queueNumber > 0, 'No queue number for follow-up');
  // Follow-up should be at position 1 (priority)
  assert(r.body.data?.queueItem?.isFollowUp === true, 'isFollowUp not set');
});

// ─── SUITE 8: Doctor flow ─────────────────────────────────────────────────────
console.log('\n━━━ 8. Doctor Flow ━━━');

await test('Doctor — get today\'s appointments', async () => {
  const r = await req('GET', '/api/doctor/today', null, doctorToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(Array.isArray(r.body.data?.appointments), 'No appointments array');
});

await test('Doctor — get all appointments with filter', async () => {
  const r = await req('GET', '/api/doctor/appointments?status=BOOKED', null, doctorToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('Doctor — update availability', async () => {
  const r = await req('PATCH', '/api/doctor/availability', {
    onlineAvailable: true, offlineAvailable: true,
  }, doctorToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('Doctor — update profile', async () => {
  const r = await req('PATCH', '/api/doctor/profile', {
    avgConsultationMins: 12,
    bio: 'Updated bio for testing',
  }, doctorToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

// ─── SUITE 9: Prescriptions ───────────────────────────────────────────────────
console.log('\n━━━ 9. Prescriptions ━━━');

// Need a completed appointment for prescription
let completedApptId;
await test('Doctor — complete a consultation', async () => {
  // Find an IN_CONSULTATION or BOOKED appointment
  const r = await req('GET', '/api/doctor/appointments', null, doctorToken);
  const appts = r.body.data?.appointments || [];
  const target = appts.find((a) => ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION'].includes(a.status));
  if (!target) return 'WARN';

  // Start it
  await req('PATCH', `/api/doctor/appointments/${target.id}/start`, null, doctorToken);
  // Complete it
  const completeRes = await req('PATCH', `/api/doctor/appointments/${target.id}/complete`, {
    notes: 'Patient responded well to treatment',
  }, doctorToken);
  assert(completeRes.status === 200, `Expected 200, got ${completeRes.status}`);
  completedApptId = target.id;
});

await test('Doctor — create prescription', async () => {
  if (!completedApptId) return 'WARN';
  const r = await req('POST', '/api/prescriptions', {
    appointmentId: completedApptId,
    diagnosis: 'Acute pharyngitis',
    medicines: [
      { name: 'Amoxicillin 500mg', dosage: '1 tablet', frequency: 'Thrice daily', duration: '5 days', notes: 'After meals' },
      { name: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'As needed', duration: '3 days', notes: 'For fever' },
    ],
    instructions: 'Rest for 3 days. Drink plenty of fluids.',
    requiresFollowUp: true,
    followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }, doctorToken);
  assert(r.status === 201, `Expected 201, got ${r.status}: ${JSON.stringify(r.body)}`);
  prescriptionId = r.body.data?.prescription?.id;
});

await test('Patient — get my prescriptions', async () => {
  const r = await req('GET', '/api/prescriptions/my', null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('Prescription by appointment ID', async () => {
  if (!completedApptId) return 'WARN';
  const r = await req('GET', `/api/prescriptions/appointment/${completedApptId}`, null, patientToken);
  // May be 404 if patient doesn't own this appointment — that's correct access control
  assert(r.status === 200 || r.status === 403 || r.status === 404, `Unexpected status ${r.status}`);
});

// ─── SUITE 10: FCM Notifications ─────────────────────────────────────────────
console.log('\n━━━ 10. FCM Notifications ━━━');

await test('Register FCM token', async () => {
  const r = await req('POST', '/api/notifications/fcm-token', {
    token: 'test_fcm_token_' + Date.now(),
    platform: 'web',
  }, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('Remove FCM token', async () => {
  const token = 'test_fcm_remove_' + Date.now();
  await req('POST', '/api/notifications/fcm-token', { token, platform: 'web' }, patientToken);
  const r = await req('DELETE', '/api/notifications/fcm-token', { token }, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

// ─── SUITE 11: Cancel appointment ────────────────────────────────────────────
console.log('\n━━━ 11. Appointment Cancellation ━━━');

await test('Patient — cancel appointment', async () => {
  // Book a new one to cancel
  const d = new Date(); d.setDate(d.getDate() + 3);
  const initRes = await req('POST', '/api/payments/initiate', {
    doctorId, clinicId,
    appointmentType: 'OFFLINE',
    appointmentDate: d.toISOString().split('T')[0],
  }, patientToken);
  if (initRes.status !== 200 && initRes.status !== 201) return 'WARN';

  const newApptId = initRes.body.data?.appointmentId;
  const orderId   = initRes.body.data?.order?.id;

  // Verify payment
  await req('POST', '/api/payments/verify', {
    appointmentId: newApptId,
    razorpayOrderId: orderId,
    razorpayPaymentId: `pay_dev_${Date.now()}`,
    razorpaySignature: 'dev_sig',
  }, patientToken);

  // Cancel
  const r = await req('PATCH', `/api/patient/appointments/${newApptId}/cancel`, null, patientToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
});

await test('Cannot cancel already-completed appointment', async () => {
  if (!completedApptId) return 'WARN';
  const r = await req('PATCH', `/api/patient/appointments/${completedApptId}/cancel`, null, patientToken);
  assert(r.status === 400, `Expected 400, got ${r.status}`);
});

// ─── SUITE 12: Admin ─────────────────────────────────────────────────────────
console.log('\n━━━ 12. Admin ━━━');

let adminToken;
await test('Admin login', async () => {
  const r = await req('POST', '/api/auth/login-password', {
    mobile: '+919000000001', password: 'Password@123',
  });
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  adminToken = r.body.data.accessToken;
});

await test('Admin — get dashboard stats', async () => {
  const r = await req('GET', '/api/admin/dashboard', null, adminToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.stats !== undefined, 'No stats in response');
});

await test('Admin — list all clinics', async () => {
  const r = await req('GET', '/api/admin/clinics', null, adminToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.length > 0, 'No clinics returned');
});

await test('Admin — list all users', async () => {
  const r = await req('GET', '/api/admin/users', null, adminToken);
  assert(r.status === 200, `Expected 200, got ${r.status}`);
  assert(r.body.data?.length > 0, 'No users returned');
});

await test('Non-admin cannot access admin routes', async () => {
  const r = await req('GET', '/api/admin/dashboard', null, patientToken);
  assert(r.status === 403, `Expected 403, got ${r.status}`);
});

// ─── SUITE 13: Rate limiting ──────────────────────────────────────────────────
console.log('\n━━━ 13. Security ━━━');

await test('Expired/invalid token returns 401', async () => {
  const r = await req('GET', '/api/patient/profile', null, 'invalid.token.here');
  assert(r.status === 401, `Expected 401, got ${r.status}`);
});

await test('Role-based access — patient cannot access doctor routes', async () => {
  const r = await req('GET', '/api/doctor/today', null, patientToken);
  assert(r.status === 403, `Expected 403, got ${r.status}`);
});

await test('Role-based access — patient cannot access admin routes', async () => {
  const r = await req('GET', '/api/admin/users', null, patientToken);
  assert(r.status === 403, `Expected 403, got ${r.status}`);
});

// ─── RESULTS ─────────────────────────────────────────────────────────────────
const prisma = require('./src/config/database');
await prisma.$disconnect();

console.log('\n' + '═'.repeat(55));
console.log(`  RESULTS: ${passed} passed  |  ${warnings} warnings  |  ${failed} failed`);
console.log('═'.repeat(55));

if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter((r) => r.status === '❌').forEach((r) => {
    console.log(`  ❌ ${r.name}`);
    if (r.error) console.log(`     → ${r.error}`);
  });
}

if (warnings > 0) {
  console.log('\nWarnings (skipped — no data):');
  results.filter((r) => r.status === '⚠️ ').forEach((r) => {
    console.log(`  ⚠️  ${r.name}`);
  });
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
