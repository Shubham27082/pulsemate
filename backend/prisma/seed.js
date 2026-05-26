require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PulseMate seed...');

  // ─── Clean all data ───────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.fcmToken.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.queueItem.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorClinic.deleteMany();
  await prisma.clinicStaff.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared all existing data');

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // ─── Super Admin ──────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      mobile: '+919000000001',
      email: 'admin@pulsemate.com',
      role: 'SUPER_ADMIN',
      passwordHash,
    },
  });
  console.log('✅ Super Admin:', superAdmin.mobile);

  // ─── Clinic Owner ─────────────────────────────────────────────────────────
  const clinicOwner = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma',
      mobile: '+919000000002',
      email: 'owner@pulsemate.com',
      role: 'CLINIC_OWNER',
      passwordHash,
    },
  });
  console.log('✅ Clinic Owner:', clinicOwner.mobile);

  // ─── Dr. Pooja ────────────────────────────────────────────────────────────
  const doctorPooja = await prisma.user.create({
    data: {
      name: 'Pooja',
      mobile: '+919000000011',
      email: 'pooja@pulsemate.com',
      role: 'DOCTOR',
      passwordHash,
      doctorProfile: {
        create: {
          specialization: 'Physiotherapy',
          experienceYears: 6,
          education: 'BPT - Bachelor of Physiotherapy',
          consultationFee: 600,
          onlineAvailable: true,
          offlineAvailable: true,
          bio: 'Physiotherapist specializing in rehabilitation and pain management.',
          avgConsultationMins: 25,
        },
      },
    },
    include: { doctorProfile: true },
  });
  console.log('✅ Dr. Pooja:', doctorPooja.mobile);

  // ─── Dr. Arjun Upadhyay ───────────────────────────────────────────────────
  const doctorArjun = await prisma.user.create({
    data: {
      name: 'Arjun Upadhyay',
      mobile: '+919000000013',
      email: 'arjun@pulsemate.com',
      role: 'DOCTOR',
      passwordHash,
      doctorProfile: {
        create: {
          specialization: 'Physiotherapy',
          experienceYears: 8,
          education: 'MPT - Master of Physiotherapy',
          consultationFee: 600,
          onlineAvailable: false,
          offlineAvailable: true,
          bio: 'Senior physiotherapist with expertise in spine rehabilitation and musculoskeletal disorders.',
          avgConsultationMins: 30,
        },
      },
    },
    include: { doctorProfile: true },
  });
  console.log('✅ Dr. Arjun Upadhyay:', doctorArjun.mobile);

  // ─── Receptionist ─────────────────────────────────────────────────────────
  const receptionist = await prisma.user.create({
    data: {
      name: 'Sunita Verma',
      mobile: '+919000000005',
      email: 'reception@pulsemate.com',
      role: 'RECEPTIONIST',
      passwordHash,
    },
  });
  console.log('✅ Receptionist:', receptionist.mobile);

  // ─── Patients ─────────────────────────────────────────────────────────────
  const patients = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Rahul Kumar',
        mobile: '+919000000006',
        role: 'PATIENT',
        patientProfile: { create: { age: 35, gender: 'MALE', bloodGroup: 'O+', address: '123 MG Road, Bangalore' } },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Anita Singh',
        mobile: '+919000000007',
        role: 'PATIENT',
        patientProfile: { create: { age: 28, gender: 'FEMALE', bloodGroup: 'A+', address: '456 Koramangala, Bangalore' } },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Vikram Nair',
        mobile: '+919000000008',
        role: 'PATIENT',
        patientProfile: { create: { age: 45, gender: 'MALE', bloodGroup: 'B+', address: '789 Indiranagar, Bangalore' } },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Meera Joshi',
        mobile: '+919000000009',
        role: 'PATIENT',
        patientProfile: { create: { age: 32, gender: 'FEMALE', bloodGroup: 'AB+', address: '22 HSR Layout, Bangalore' } },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Suresh Reddy',
        mobile: '+919000000010',
        role: 'PATIENT',
        patientProfile: { create: { age: 52, gender: 'MALE', bloodGroup: 'B-', address: '5 Whitefield, Bangalore' } },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Kavya Iyer',
        mobile: '+919000000012',
        role: 'PATIENT',
        patientProfile: { create: { age: 24, gender: 'FEMALE', bloodGroup: 'O-', address: '88 Jayanagar, Bangalore' } },
      },
    }),
  ]);
  console.log('✅ Patients created (6 total)');

  // ─── Spine Clinic ─────────────────────────────────────────────────────────
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Spine Clinic',
      ownerId: clinicOwner.id,
      phone: '+918000000001',
      address: '100 Health Street, Koramangala',
      city: 'Bangalore',
      latitude: 12.9352,
      longitude: 77.6245,
      isVerified: true,
      openingTime: '09:00',
      closingTime: '20:00',
      description: 'A modern multi-specialty clinic offering comprehensive healthcare services.',
    },
  });
  console.log('✅ Clinic created:', clinic.name);

  // ─── Clinic Staff ─────────────────────────────────────────────────────────
  await prisma.clinicStaff.createMany({
    data: [
      { clinicId: clinic.id, userId: clinicOwner.id,   role: 'OWNER'        },
      { clinicId: clinic.id, userId: doctorPooja.id,   role: 'DOCTOR'       },
      { clinicId: clinic.id, userId: doctorArjun.id,   role: 'DOCTOR'       },
      { clinicId: clinic.id, userId: receptionist.id,  role: 'RECEPTIONIST' },
    ],
  });
  console.log('✅ Clinic staff linked');

  // ─── Doctor-Clinic Links ──────────────────────────────────────────────────
  await prisma.doctorClinic.createMany({
    data: [
      {
        doctorId: doctorPooja.doctorProfile.id,
        clinicId: clinic.id,
        consultationFee: 600,
        availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        startTime: '09:00',
        endTime: '18:00',
        avgConsultationMins: 25,
      },
      {
        doctorId: doctorArjun.doctorProfile.id,
        clinicId: clinic.id,
        consultationFee: 600,
        availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        startTime: '10:00',
        endTime: '19:00',
        avgConsultationMins: 30,
      },
    ],
  });
  console.log('✅ Doctor-Clinic links created');

  // ─── Today's Queue for Dr. Pooja (6 patients) ────────────────────────────
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const queueData = [
    { patient: patients[0], slot: '09:00', q: 1, wait: 25,  symptoms: 'Lower back pain' },
    { patient: patients[1], slot: '09:25', q: 2, wait: 50,  symptoms: 'Neck stiffness and pain' },
    { patient: patients[2], slot: '09:50', q: 3, wait: 75,  symptoms: 'Knee rehabilitation post-surgery' },
    { patient: patients[3], slot: '10:15', q: 4, wait: 100, symptoms: 'Shoulder pain and restricted movement' },
    { patient: patients[4], slot: '10:40', q: 5, wait: 125, symptoms: 'Sciatica pain' },
    { patient: patients[5], slot: '11:05', q: 6, wait: 150, symptoms: 'Post-fracture physiotherapy' },
  ];

  const appointments = [];
  for (const d of queueData) {
    const appt = await prisma.appointment.create({
      data: {
        patientId: d.patient.id,
        doctorId: doctorPooja.doctorProfile.id,
        clinicId: clinic.id,
        appointmentType: 'OFFLINE',
        appointmentDate: today,
        slotTime: d.slot,
        status: 'IN_QUEUE',
        queueNumber: d.q,
        estimatedWaitMinutes: d.wait,
        symptoms: d.symptoms,
      },
    });
    appointments.push(appt);
  }

  const queue = await prisma.queue.create({
    data: {
      clinicId: clinic.id,
      doctorId: doctorPooja.doctorProfile.id,
      date: today,
      status: 'ACTIVE',
    },
  });

  for (let i = 0; i < appointments.length; i++) {
    await prisma.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId: appointments[i].id,
        patientId: queueData[i].patient.id,
        queueNumber: i + 1,
        status: 'WAITING',
        position: i + 1,
      },
    });
  }

  console.log('✅ Queue created with 6 patients for Dr. Pooja');

  console.log('\n🎉 Seed completed!\n');
  console.log('─────────────────────────────────────────');
  console.log('📋 Credentials (Password: Password@123)');
  console.log('─────────────────────────────────────────');
  console.log('Super Admin:       +919000000001 | admin@pulsemate.com');
  console.log('Clinic Owner:      +919000000002 | owner@pulsemate.com');
  console.log('Dr. Pooja:         +919000000011 | pooja@pulsemate.com');
  console.log('Dr. Arjun Upadhyay:+919000000013 | arjun@pulsemate.com');
  console.log('Receptionist:      +919000000005 | reception@pulsemate.com');
  console.log('─────────────────────────────────────────');
  console.log('Clinic: Spine Clinic (Bangalore)');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
