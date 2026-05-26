'use strict';

/**
 * PulseMate Backend Integration Tests
 * Pure CommonJS, no top-level await, uses built-in http module only.
 * Run: node test_pulsemate.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// ─── Shared state ─────────────────────────────────────────────────────────────
let staffToken       = '';
let receptionToken   = '';
let adminToken       = '';
let patientToken     = '';
let patientUserId    = '';
let doctorId         = '';   // DoctorProfile.id
let clinicId         = '';
let doctorUserId     = '';   // User.id of the doctor (for doctor login)
let doctorToken      = '';
let appointmentId    = '';   // from payment flow
let walkInAppointmentId = '';
let walkInQueueItemId   = '';
let doctorProfileId  = '';   // same as doctorId, alias for clarity

let passed = 0;
let failed = 0;

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise(function (resolve, reject) {
    var url = new URL(path, BASE_URL);
    var postData = body ? JSON.stringify(body) : null;

    var options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    var req = http.request(options, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        var parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);

    if (postData) req.write(postData);
    req.end();
  });
}

// ─── Test runner ──────────────────────────────────────────────────────────────
function pass(name) {
  passed++;
  console.log('  ✅ PASS  ' + name);
}

function fail(name, reason) {
  failed++;
  console.log('  ❌ FAIL  ' + name + (reason ? '  →  ' + reason : ''));
}

function assert(condition, name, reason) {
  if (condition) pass(name); else fail(name, reason);
}

// ─── Tomorrow helper ──────────────────────────────────────────────────────────
function tomorrow() {
  var d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ─── Future date helper (3 days out, avoids conflicts from prior runs) ────────
function futureDate() {
  var d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

function test01_healthCheck() {
  return request('GET', '/health').then(function (res) {
    assert(
      res.status === 200 && res.body && res.body.status === 'ok',
      'Health check GET /health',
      'status=' + res.status + ' body=' + JSON.stringify(res.body)
    );
  });
}

function test02_staffLogin() {
  return request('POST', '/api/auth/login-password', {
    mobile: '+919000000003',
    password: 'Password@123',
  }).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data && res.body.data.accessToken;
    assert(ok, 'Staff password login POST /api/auth/login-password', 'status=' + res.status);
    if (ok) staffToken = res.body.data.accessToken;
  });
}

function test03_receptionistLogin() {
  return request('POST', '/api/auth/login-password', {
    mobile: '+919000000005',
    password: 'Password@123',
  }).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data && res.body.data.accessToken;
    assert(ok, 'Receptionist login mobile:+919000000005', 'status=' + res.status);
    if (ok) receptionToken = res.body.data.accessToken;
  });
}

function test04_adminLogin() {
  return request('POST', '/api/auth/login-password', {
    mobile: '+919000000001',
    password: 'Password@123',
  }).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data && res.body.data.accessToken;
    assert(ok, 'Admin login mobile:+919000000001', 'status=' + res.status);
    if (ok) adminToken = res.body.data.accessToken;
  });
}

function test05_patientOtp() {
  var mobile = '+919000000007';
  var devOtp;
  return request('POST', '/api/auth/send-otp', { mobile: mobile, purpose: 'LOGIN' })
    .then(function (res) {
      var ok = res.status === 200 && res.body && res.body.data;
      assert(ok, 'Patient OTP send POST /api/auth/send-otp', 'status=' + res.status);
      if (ok && res.body.data.devOtp) {
        devOtp = res.body.data.devOtp;
      }
      if (!devOtp) {
        fail('Patient OTP verify POST /api/auth/verify-otp', 'devOtp not returned from send-otp');
        return;
      }
      return request('POST', '/api/auth/verify-otp', { mobile: mobile, otp: devOtp, purpose: 'LOGIN' })
        .then(function (res2) {
          var ok2 = res2.status === 200 && res2.body && res2.body.data && res2.body.data.accessToken;
          assert(ok2, 'Patient OTP verify POST /api/auth/verify-otp', 'status=' + res2.status);
          if (ok2) {
            patientToken = res2.body.data.accessToken;
            patientUserId = res2.body.data.user && res2.body.data.user.id;
          }
        });
    });
}

function test06_getMe() {
  return request('GET', '/api/auth/me', null, patientToken).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data && res.body.data.user;
    assert(ok, 'GET /api/auth/me with patient token', 'status=' + res.status);
  });
}

function test07_updateProfile() {
  return request('PATCH', '/api/patient/profile', {
    name: 'Test Patient',
    gender: 'MALE',
    dob: '1995-06-15',
    city: 'Mumbai',
    emergencyContact: '+919111111111',
    bloodGroup: 'O+',
  }, patientToken).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data && res.body.data.user;
    assert(ok, 'PATCH /api/patient/profile update profile', 'status=' + res.status);
  });
}

function test08_searchDoctors() {
  return request('GET', '/api/patient/doctors', null, null).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data;
    assert(ok, 'GET /api/patient/doctors search all', 'status=' + res.status);
    if (ok) {
      // Extract first doctor with a clinic for later tests
      var doctors = res.body.data;
      if (!Array.isArray(doctors)) doctors = res.body.data.data || [];
      for (var i = 0; i < doctors.length; i++) {
        var d = doctors[i];
        if (d && d.doctorClinics && d.doctorClinics.length > 0) {
          doctorId = d.id;
          doctorProfileId = d.id;
          clinicId = d.doctorClinics[0].clinic.id;
          doctorUserId = d.user && d.user.id;
          break;
        }
      }
    }
  });
}

function test09_searchBySpecialization() {
  return request('GET', '/api/patient/doctors?specialization=Cardiologist', null, null).then(function (res) {
    var ok = res.status === 200 && res.body;
    assert(ok, 'GET /api/patient/doctors?specialization=Cardiologist', 'status=' + res.status);
  });
}

// ─── Shared booking date (set once, reused for duplicate test) ───────────────
var bookingDate = futureDate();

function test10_initiatePayment() {
  if (!doctorId || !clinicId) {
    fail('POST /api/payments/initiate', 'No doctorId/clinicId from step 8');
    return Promise.resolve();
  }
  return request('POST', '/api/payments/initiate', {
    doctorId: doctorId,
    clinicId: clinicId,
    appointmentType: 'OFFLINE',
    appointmentDate: tomorrow(),
  }, patientToken).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data && res.body.data.appointmentId;
    assert(ok, 'POST /api/payments/initiate', 'status=' + res.status + ' body=' + JSON.stringify(res.body).slice(0, 200));
    if (ok) {
      appointmentId = res.body.data.appointmentId;
      // Store order id for verify step
      test10_initiatePayment._orderId = res.body.data.order && res.body.data.order.id;
    }
  });
}

function test11_verifyPayment() {
  if (!appointmentId) {
    fail('POST /api/payments/verify', 'No appointmentId from step 10');
    return Promise.resolve();
  }
  var orderId = test10_initiatePayment._orderId || ('order_dev_' + Date.now());
  return request('POST', '/api/payments/verify', {
    appointmentId: appointmentId,
    razorpayOrderId: orderId,
    razorpayPaymentId: 'pay_dev_test',
    razorpaySignature: 'dev_sig',
  }, patientToken).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data && res.body.data.verified === true;
    assert(ok, 'POST /api/payments/verify (dev mode)', 'status=' + res.status + ' body=' + JSON.stringify(res.body).slice(0, 200));
  });
}

function test12_getAppointments() {
  return request('GET', '/api/patient/appointments', null, patientToken).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data;
    var hasBooked = false;
    if (ok) {
      var appts = res.body.data;
      if (!Array.isArray(appts)) appts = res.body.data.data || [];
      hasBooked = appts.some(function (a) { return a.status === 'BOOKED'; });
    }
    assert(ok && hasBooked, 'GET /api/patient/appointments - verify BOOKED status', 'status=' + res.status + ' hasBooked=' + hasBooked);
  });
}

function test13_getLiveQueue() {
  if (!appointmentId) {
    fail('GET /api/patient/queue/:appointmentId', 'No appointmentId from step 10');
    return Promise.resolve();
  }
  return request('GET', '/api/patient/queue/' + appointmentId, null, patientToken).then(function (res) {
    var ok = res.status === 200 && res.body;
    assert(ok, 'GET /api/patient/queue/:appointmentId', 'status=' + res.status);
  });
}

function test14_doctorToday() {
  // +919000000003 is Doctor 1 (Dr. Priya Mehta) — login fresh to get doctor token
  return request('POST', '/api/auth/login-password', {
    mobile: '+919000000003',
    password: 'Password@123',
  }).then(function (loginRes) {
    if (loginRes.status !== 200 || !loginRes.body || !loginRes.body.data || !loginRes.body.data.accessToken) {
      fail('GET /api/doctor/today with doctor token', 'Doctor login failed: status=' + loginRes.status);
      return;
    }
    doctorToken = loginRes.body.data.accessToken;
    return request('GET', '/api/doctor/today', null, doctorToken).then(function (res) {
      assert(res.status === 200, 'GET /api/doctor/today with doctor token', 'status=' + res.status + ' body=' + JSON.stringify(res.body).slice(0, 200));
    });
  });
}

function test15_receptionQueue() {
  if (!doctorProfileId || !clinicId) {
    fail('GET /api/reception/queue/:doctorProfileId?clinicId=X', 'No doctorProfileId/clinicId');
    return Promise.resolve();
  }
  return request('GET', '/api/reception/queue/' + doctorProfileId + '?clinicId=' + clinicId, null, receptionToken).then(function (res) {
    var ok = res.status === 200 && res.body;
    assert(ok, 'GET /api/reception/queue/:doctorProfileId?clinicId=X', 'status=' + res.status + ' body=' + JSON.stringify(res.body).slice(0, 200));
  });
}

function test16_walkIn() {
  if (!doctorId || !clinicId) {
    fail('POST /api/reception/walk-in', 'No doctorId/clinicId');
    return Promise.resolve();
  }
  return request('POST', '/api/reception/walk-in', {
    doctorId: doctorId,
    clinicId: clinicId,
    patientMobile: '+919222222222',
    patientName: 'Test Walkin',
  }, receptionToken).then(function (res) {
    var ok = (res.status === 200 || res.status === 201) && res.body && res.body.data;
    assert(ok, 'POST /api/reception/walk-in', 'status=' + res.status + ' body=' + JSON.stringify(res.body).slice(0, 200));
    if (ok) {
      walkInAppointmentId = res.body.data.appointment && res.body.data.appointment.id;
      walkInQueueItemId   = res.body.data.queueItem && res.body.data.queueItem.id;
    }
  });
}

function test17_followUp() {
  if (!doctorId || !clinicId || !walkInAppointmentId) {
    fail('POST /api/reception/follow-up', 'No walkInAppointmentId from step 16');
    return Promise.resolve();
  }
  return request('POST', '/api/reception/follow-up', {
    doctorId: doctorId,
    clinicId: clinicId,
    originalAppointmentId: walkInAppointmentId,
  }, receptionToken).then(function (res) {
    var ok = (res.status === 200 || res.status === 201) && res.body && res.body.data;
    assert(ok, 'POST /api/reception/follow-up', 'status=' + res.status + ' body=' + JSON.stringify(res.body).slice(0, 200));
  });
}

function test18_createPrescription() {
  // We need a COMPLETED appointment for the doctor.
  // First start then complete the walk-in appointment using doctor token.
  if (!walkInAppointmentId || !doctorToken) {
    fail('POST /api/prescriptions (doctor creates prescription)', 'No walkInAppointmentId or doctorToken');
    return Promise.resolve();
  }

  return request('PATCH', '/api/doctor/appointments/' + walkInAppointmentId + '/start', {}, doctorToken)
    .then(function (startRes) {
      // start may fail if doctor doesn't own it — that's ok, try complete anyway
      return request('PATCH', '/api/doctor/appointments/' + walkInAppointmentId + '/complete', { notes: 'Test complete' }, doctorToken);
    })
    .then(function (completeRes) {
      // Now create prescription
      return request('POST', '/api/prescriptions', {
        appointmentId: walkInAppointmentId,
        diagnosis: 'Test Diagnosis',
        medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'TDS', duration: '5 days' }],
        instructions: 'Rest and drink water',
        requiresFollowUp: false,
      }, doctorToken);
    })
    .then(function (res) {
      var ok = (res.status === 200 || res.status === 201) && res.body && res.body.data && res.body.data.prescription;
      assert(ok, 'POST /api/prescriptions (doctor creates prescription)', 'status=' + res.status + ' body=' + JSON.stringify(res.body).slice(0, 200));
    });
}

function test19_getMyPrescriptions() {
  return request('GET', '/api/prescriptions/my', null, patientToken).then(function (res) {
    var ok = res.status === 200 && res.body && res.body.data;
    assert(ok, 'GET /api/prescriptions/my with patient token', 'status=' + res.status);
  });
}

function test20_registerFcmToken() {
  return request('POST', '/api/notifications/fcm-token', {
    token: 'test_fcm_token_abc123',
    platform: 'android',
  }, patientToken).then(function (res) {
    var ok = res.status === 200 && res.body;
    assert(ok, 'POST /api/notifications/fcm-token register token', 'status=' + res.status);
  });
}

function test21_adminDashboard() {
  if (!adminToken) {
    fail('GET /api/admin/dashboard with admin token', 'No admin token');
    return Promise.resolve();
  }
  return request('GET', '/api/admin/dashboard', null, adminToken).then(function (res) {
    var ok = res.status === 200 && res.body;
    assert(ok, 'GET /api/admin/dashboard with admin token', 'status=' + res.status);
  });
}

function test22_adminClinics() {
  if (!adminToken) {
    fail('GET /api/admin/clinics', 'No admin token');
    return Promise.resolve();
  }
  return request('GET', '/api/admin/clinics', null, adminToken).then(function (res) {
    var ok = res.status === 200 && res.body;
    assert(ok, 'GET /api/admin/clinics', 'status=' + res.status);
  });
}

function test23_invalidToken() {
  return request('GET', '/api/auth/me', null, 'bad.token.here').then(function (res) {
    assert(res.status === 401, 'Invalid token returns 401 GET /api/auth/me', 'status=' + res.status);
  });
}

function test24_patientCannotAccessDoctorRoute() {
  return request('GET', '/api/doctor/today', null, patientToken).then(function (res) {
    assert(res.status === 403, 'Patient cannot access doctor route (expects 403)', 'status=' + res.status);
  });
}

function test25_duplicateBooking() {
  if (!doctorId || !clinicId) {
    fail('Duplicate booking same date should return 409', 'No doctorId/clinicId');
    return Promise.resolve();
  }
  // Try to book the same doctor+clinic+date again (appointmentDate = tomorrow, same as step 10)
  return request('POST', '/api/payments/initiate', {
    doctorId: doctorId,
    clinicId: clinicId,
    appointmentType: 'OFFLINE',
    appointmentDate: tomorrow(),
  }, patientToken).then(function (res) {
    assert(res.status === 409, 'Duplicate booking same date should return 409', 'status=' + res.status + ' body=' + JSON.stringify(res.body).slice(0, 200));
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  PulseMate Backend Integration Tests');
  console.log('  Target: ' + BASE_URL);
  console.log('══════════════════════════════════════════════════════\n');

  var tests = [
    { name: 'Test 01', fn: test01_healthCheck },
    { name: 'Test 02', fn: test02_staffLogin },
    { name: 'Test 03', fn: test03_receptionistLogin },
    { name: 'Test 04', fn: test04_adminLogin },
    { name: 'Test 05', fn: test05_patientOtp },
    { name: 'Test 06', fn: test06_getMe },
    { name: 'Test 07', fn: test07_updateProfile },
    { name: 'Test 08', fn: test08_searchDoctors },
    { name: 'Test 09', fn: test09_searchBySpecialization },
    { name: 'Test 10', fn: test10_initiatePayment },
    { name: 'Test 11', fn: test11_verifyPayment },
    { name: 'Test 12', fn: test12_getAppointments },
    { name: 'Test 13', fn: test13_getLiveQueue },
    { name: 'Test 14', fn: test14_doctorToday },
    { name: 'Test 15', fn: test15_receptionQueue },
    { name: 'Test 16', fn: test16_walkIn },
    { name: 'Test 17', fn: test17_followUp },
    { name: 'Test 18', fn: test18_createPrescription },
    { name: 'Test 19', fn: test19_getMyPrescriptions },
    { name: 'Test 20', fn: test20_registerFcmToken },
    { name: 'Test 21', fn: test21_adminDashboard },
    { name: 'Test 22', fn: test22_adminClinics },
    { name: 'Test 23', fn: test23_invalidToken },
    { name: 'Test 24', fn: test24_patientCannotAccessDoctorRoute },
    { name: 'Test 25', fn: test25_duplicateBooking },
  ];

  // Run tests sequentially using promise chaining
  var chain = Promise.resolve();
  tests.forEach(function (t) {
    chain = chain.then(function () {
      return t.fn().catch(function (err) {
        fail(t.name, 'Unexpected error: ' + (err && err.message ? err.message : String(err)));
      });
    });
  });

  chain.then(function () {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  Results: ' + passed + ' passed, ' + failed + ' failed  (total ' + (passed + failed) + ')');
    console.log('══════════════════════════════════════════════════════\n');
    process.exit(failed > 0 ? 1 : 0);
  });
}

main();
