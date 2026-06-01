require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting PulseMate seed...');

  const adminEmail = 'sahilnaik1515@gmail.com';
  const adminPassword = 'Nkabu18$';

  await prisma.auditLog.deleteMany();
  await prisma.fcmToken.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.queueItem.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorClinic.deleteMany();
  await prisma.clinicStaff.deleteMany();
  await prisma.receptionistProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password@123', 12);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const rootAdmin = await prisma.user.create({
    data: {
      name: 'Sahil Naik',
      mobile: '+919000000001',
      email: adminEmail,
      role: 'SUPER_ADMIN',
      approvalStatus: 'VERIFIED',
      passwordHash: adminPasswordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      adminProfile: {
        create: { level: 'ROOT' },
      },
    },
    include: { adminProfile: true },
  });

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Platform Admin',
      mobile: '+919000000000',
      email: 'admin@pulsemate.com',
      role: 'SUPER_ADMIN',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      adminProfile: {
        create: { level: 'SUPER_ADMIN', createdById: rootAdmin.id },
      },
    },
    include: { adminProfile: true },
  });

  const clinicOwner = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma',
      mobile: '+919000000002',
      email: 'owner@pulsemate.com',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash,
    },
  });

  const doctorPooja = await prisma.user.create({
    data: {
      name: 'Pooja',
      mobile: '+919000000011',
      email: 'pooja@pulsemate.com',
      role: 'DOCTOR',
      approvalStatus: 'VERIFIED',
      passwordHash,
      doctorProfile: {
        create: {
          approvalStatus: 'VERIFIED',
          qualification: 'BPT',
          specialization: 'Physiotherapy',
          experienceYears: 6,
          education: 'Bachelor of Physiotherapy',
          consultationFee: 600,
          onlineAvailable: true,
          offlineAvailable: true,
          bio: 'Physiotherapist specializing in rehabilitation and pain management.',
          avgConsultationMins: 25,
          medicalRegistrationNumber: 'PM-DR-0001',
          certificates: ['https://example.com/certificates/pooja.pdf'],
          languagesKnown: ['English', 'Hindi', 'Kannada'],
          marketplaceVisible: true,
        },
      },
    },
    include: { doctorProfile: true },
  });

  const doctorArjun = await prisma.user.create({
    data: {
      name: 'Arjun Upadhyay',
      mobile: '+919000000013',
      email: 'arjun@pulsemate.com',
      role: 'DOCTOR',
      approvalStatus: 'VERIFIED',
      passwordHash,
      doctorProfile: {
        create: {
          approvalStatus: 'VERIFIED',
          qualification: 'MPT',
          specialization: 'Physiotherapy',
          experienceYears: 8,
          education: 'Master of Physiotherapy',
          consultationFee: 600,
          onlineAvailable: false,
          offlineAvailable: true,
          bio: 'Senior physiotherapist with expertise in spine rehabilitation and musculoskeletal disorders.',
          avgConsultationMins: 30,
          medicalRegistrationNumber: 'PM-DR-0002',
          certificates: ['https://example.com/certificates/arjun.pdf'],
          languagesKnown: ['English', 'Hindi'],
          marketplaceVisible: true,
        },
      },
    },
    include: { doctorProfile: true },
  });

  const clinic = await prisma.clinic.create({
    data: {
      name: 'Spine Clinic',
      ownerId: clinicOwner.id,
      phone: '+918000000001',
      address: '100 Health Street, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      isVerified: true,
      approvalStatus: 'VERIFIED',
      openingTime: '09:00',
      closingTime: '20:00',
      openingHours: 'Mon-Sat 09:00-20:00',
      clinicLicenseDocument: 'https://example.com/licenses/spine-clinic.pdf',
      specialties: ['Physiotherapy', 'Rehabilitation'],
      description: 'A modern multi-specialty clinic offering comprehensive healthcare services.',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'Sunita Verma',
      mobile: '+919000000005',
      email: 'reception@pulsemate.com',
      role: 'RECEPTIONIST',
      approvalStatus: 'VERIFIED',
      passwordHash,
      receptionistProfile: {
        create: {
          assignedClinicId: clinic.id,
          createdByOwnerId: clinicOwner.id,
        },
      },
    },
    include: { receptionistProfile: true },
  });

  await prisma.clinicStaff.createMany({
    data: [
      { clinicId: clinic.id, userId: clinicOwner.id, role: 'OWNER' },
      { clinicId: clinic.id, userId: doctorPooja.id, role: 'DOCTOR' },
      { clinicId: clinic.id, userId: doctorArjun.id, role: 'DOCTOR' },
      { clinicId: clinic.id, userId: receptionist.id, role: 'RECEPTIONIST' },
    ],
  });

  await prisma.doctorClinic.createMany({
    data: [
      {
        doctorId: doctorPooja.doctorProfile.id,
        clinicId: clinic.id,
        inviteStatus: 'ACCEPTED',
        consultationFee: 600,
        availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        startTime: '09:00',
        endTime: '18:00',
        avgConsultationMins: 25,
        joinedAt: new Date(),
      },
      {
        doctorId: doctorArjun.doctorProfile.id,
        clinicId: clinic.id,
        inviteStatus: 'ACCEPTED',
        consultationFee: 600,
        availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        startTime: '10:00',
        endTime: '19:00',
        avgConsultationMins: 30,
        joinedAt: new Date(),
      },
    ],
  });

  const patients = await Promise.all(
    [
      ['Rahul Kumar', '+919000000006', 'MALE', 35, 'O+', '123 MG Road, Bangalore'],
      ['Anita Singh', '+919000000007', 'FEMALE', 28, 'A+', '456 Koramangala, Bangalore'],
      ['Vikram Nair', '+919000000008', 'MALE', 45, 'B+', '789 Indiranagar, Bangalore'],
      ['Meera Joshi', '+919000000009', 'FEMALE', 32, 'AB+', '22 HSR Layout, Bangalore'],
      ['Suresh Reddy', '+919000000010', 'MALE', 52, 'B-', '5 Whitefield, Bangalore'],
      ['Kavya Iyer', '+919000000012', 'FEMALE', 24, 'O-', '88 Jayanagar, Bangalore'],
    ].map(([name, mobile, gender, age, bloodGroup, address]) =>
      prisma.user.create({
        data: {
          name,
          mobile,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          patientProfile: {
            create: {
              age,
              gender,
              bloodGroup,
              address,
              city: 'Bangalore',
              state: 'Karnataka',
              profileCompleted: true,
            },
          },
        },
      })
    )
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const queueData = [
    { patient: patients[0], slot: '09:00', q: 1, wait: 25, symptoms: 'Lower back pain' },
    { patient: patients[1], slot: '09:25', q: 2, wait: 50, symptoms: 'Neck stiffness and pain' },
    { patient: patients[2], slot: '09:50', q: 3, wait: 75, symptoms: 'Knee rehabilitation post-surgery' },
    { patient: patients[3], slot: '10:15', q: 4, wait: 100, symptoms: 'Shoulder pain and restricted movement' },
    { patient: patients[4], slot: '10:40', q: 5, wait: 125, symptoms: 'Sciatica pain' },
    { patient: patients[5], slot: '11:05', q: 6, wait: 150, symptoms: 'Post-fracture physiotherapy' },
  ];

  const appointments = [];
  for (const item of queueData) {
    const appt = await prisma.appointment.create({
      data: {
        patientId: item.patient.id,
        doctorId: doctorPooja.doctorProfile.id,
        clinicId: clinic.id,
        appointmentType: 'OFFLINE',
        appointmentDate: today,
        slotTime: item.slot,
        status: 'IN_QUEUE',
        queueNumber: item.q,
        estimatedWaitMinutes: item.wait,
        symptoms: item.symptoms,
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

  for (let index = 0; index < appointments.length; index += 1) {
    await prisma.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId: appointments[index].id,
        patientId: queueData[index].patient.id,
        queueNumber: index + 1,
        status: 'WAITING',
        position: index + 1,
      },
    });
  }

  console.log('Seed completed successfully');
  console.log(`Root Admin: ${adminEmail} / ${adminPassword}`);
  console.log('Super Admin: admin@pulsemate.com / Password@123');
  console.log('Clinic Owner: owner@pulsemate.com / Password@123');
  console.log('Doctor: pooja@pulsemate.com / Password@123');
  console.log('Receptionist: reception@pulsemate.com / Password@123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
