const { z } = require('zod');
const { PASSWORD_REGEX } = require('../utils/password-policy');
const { normalizeMobileNumber } = require('../utils/mobile');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);
const normalizedPhone = () =>
  z.string().transform(normalizeString).transform(normalizeMobileNumber).refine((value) => /^\+?[1-9]\d{9,14}$/.test(value), {
    message: 'Enter a valid phone number',
  });

const passwordSchema = z.string().regex(
  PASSWORD_REGEX,
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
);
const stringListSchema = z.array(z.string().trim().min(1)).default([]);
const optionalUploadSchema = z.string().trim().max(255).optional().or(z.literal(''));
const weeklyScheduleSchema = z.array(
  z.object({
    day: z.string().trim().min(2).max(20),
    enabled: z.boolean().optional(),
    openingTime: z.string().trim().optional().or(z.literal('')),
    closingTime: z.string().trim().optional().or(z.literal('')),
    breakStart: z.string().trim().optional().or(z.literal('')),
    breakEnd: z.string().trim().optional().or(z.literal('')),
  })
);

const patientSendOtpSchema = z
  .object({
    phone: z.string().optional(),
    mobile: z.string().optional(),
  })
  .transform((data) => ({
    phone: normalizeMobileNumber(normalizeString(data.phone || data.mobile || '')),
  }))
  .pipe(
    z.object({
      phone: normalizedPhone(),
    })
  );

const patientVerifyOtpSchema = z
  .object({
    phone: z.string().optional(),
    mobile: z.string().optional(),
    otp: z.string().trim(),
    name: z.string().trim().min(2).max(120).optional(),
  })
  .transform((data) => ({
    phone: normalizeMobileNumber(normalizeString(data.phone || data.mobile || '')),
    otp: data.otp,
    name: data.name,
  }))
  .pipe(
    z.object({
      phone: normalizedPhone(),
      otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
      name: z.string().trim().min(2).max(120).optional(),
    })
  );

const clinicOwnerOtpSendSchema = z
  .object({
    phone: z.string().optional(),
    mobile: z.string().optional(),
  })
  .transform((data) => ({
    phone: normalizeMobileNumber(normalizeString(data.phone || data.mobile || '')),
  }))
  .pipe(
    z.object({
      phone: normalizedPhone(),
    })
  );

const clinicOwnerOtpVerifySchema = z
  .object({
    phone: z.string().optional(),
    mobile: z.string().optional(),
    otp: z.string().trim(),
  })
  .transform((data) => ({
    phone: normalizeMobileNumber(normalizeString(data.phone || data.mobile || '')),
    otp: data.otp,
  }))
  .pipe(
    z.object({
      phone: normalizedPhone(),
      otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
    })
  );

const clinicOwnerEmailVerificationSendSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  ownerName: z.string().trim().min(2).max(120).optional(),
});

const clinicOwnerEmailOtpVerifySchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

const clinicOwnerEmailVerificationTokenSchema = z.object({
  token: z.string().trim().min(10),
});

const clinicOwnerRegisterSchema = z
  .object({
    ownerName: z.string().trim().min(2).max(120),
    phone: z.string(),
    email: z.string().trim().email(),
    password: passwordSchema,
    confirmPassword: z.string().trim().optional(),
    ownerMobileVerified: z.boolean().optional(),
    ownerEmailVerified: z.boolean().optional(),
    clinicName: z.string().trim().min(2).max(150),
    clinicType: z.string().trim().min(2).max(80).optional(),
    clinicTypeOther: z.string().trim().max(120).optional().or(z.literal('')),
    clinicDescription: z.string().trim().max(1500).optional().or(z.literal('')),
    clinicAddress: z.string().trim().min(5).max(255),
    landmark: z.string().trim().max(120).optional().or(z.literal('')),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    district: z.string().trim().min(2).max(80),
    pincode: z.string().trim().min(4).max(12),
    googleMapsLocation: z.string().trim().max(255).optional().or(z.literal('')),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    clinicPhone: z.string(),
    emergencyContactNumber: z.string().optional().or(z.literal('')),
    alternateEmail: z.string().trim().email().optional().or(z.literal('')),
    consultationModes: stringListSchema.optional(),
    weeklySchedule: weeklyScheduleSchema.optional(),
    averageConsultationTimeMinutes: z.coerce.number().int().min(5).max(180).optional(),
    appointmentSlotMinutes: z.coerce.number().int().min(5).max(180).optional(),
    dailyPatientCapacity: z.coerce.number().int().min(1).max(500).optional(),
    gstNumber: z.string().trim().optional().or(z.literal('')),
    panNumber: z.string().trim().max(40).optional().or(z.literal('')),
    openingHours: z.string().trim().min(3).max(255).optional().or(z.literal('')),
    specialties: z.array(z.string().trim().min(2).max(60)).min(1),
    numberOfDoctors: z.coerce.number().int().min(0).max(500).optional(),
    clinicLogoUrl: optionalUploadSchema,
    clinicCoverImageUrl: optionalUploadSchema,
    facilities: stringListSchema.optional(),
    languagesSpoken: stringListSchema.optional(),
    paymentMethods: stringListSchema.optional(),
    insuranceSupported: stringListSchema.optional(),
    clinicRegistrationNumber: z.string().trim().min(3).max(120),
    licenseDocumentUrl: z.string().trim().optional(),
    clinicLicenseDocument: z.string().trim().optional(),
    medicalEstablishmentCertificateUrl: optionalUploadSchema,
    gstCertificateUrl: optionalUploadSchema,
    panCardUrl: optionalUploadSchema,
    additionalDocuments: stringListSchema.optional(),
  })
  .transform((data) => ({
    ...data,
    phone: normalizeMobileNumber(data.phone),
    clinicPhone: normalizeMobileNumber(data.clinicPhone),
    emergencyContactNumber: data.emergencyContactNumber ? normalizeMobileNumber(data.emergencyContactNumber) : '',
    doctorCount: data.numberOfDoctors ?? undefined,
    consultationModes: data.consultationModes ?? [],
    weeklySchedule: data.weeklySchedule ?? [],
    averageConsultationTimeMinutes: data.averageConsultationTimeMinutes ?? undefined,
    appointmentSlotMinutes: data.appointmentSlotMinutes ?? undefined,
    dailyPatientCapacity: data.dailyPatientCapacity ?? undefined,
    facilities: data.facilities ?? [],
    languagesSpoken: data.languagesSpoken ?? [],
    paymentMethods: data.paymentMethods ?? [],
    insuranceSupported: data.insuranceSupported ?? [],
    licenseDocumentUrl: data.licenseDocumentUrl || data.clinicLicenseDocument || '',
    openingHours:
      data.openingHours ||
      (Array.isArray(data.weeklySchedule) && data.weeklySchedule.length
        ? data.weeklySchedule
          .filter((entry) => entry.enabled !== false && entry.openingTime && entry.closingTime)
          .map((entry) => `${entry.day}: ${entry.openingTime}-${entry.closingTime}`)
          .join(', ')
        : ''),
  }))
  .pipe(
    z.object({
      ownerName: z.string().trim().min(2).max(120),
      phone: normalizedPhone(),
      email: z.string().trim().email(),
      password: passwordSchema,
      ownerMobileVerified: z.boolean().optional(),
      ownerEmailVerified: z.boolean().optional(),
      clinicName: z.string().trim().min(2).max(150),
      clinicType: z.string().trim().min(2).max(80).optional(),
      clinicTypeOther: z.string().trim().max(120).optional().or(z.literal('')),
      clinicDescription: z.string().trim().max(1500).optional().or(z.literal('')),
      clinicAddress: z.string().trim().min(5).max(255),
      landmark: z.string().trim().max(120).optional().or(z.literal('')),
      city: z.string().trim().min(2).max(80),
      state: z.string().trim().min(2).max(80),
      district: z.string().trim().min(2).max(80),
      pincode: z.string().trim().min(4).max(12),
      googleMapsLocation: z.string().trim().max(255).optional().or(z.literal('')),
      latitude: z.coerce.number().min(-90).max(90).optional(),
      longitude: z.coerce.number().min(-180).max(180).optional(),
      clinicPhone: normalizedPhone(),
      emergencyContactNumber: normalizedPhone().optional().or(z.literal('')),
      alternateEmail: z.string().trim().email().optional().or(z.literal('')),
      consultationModes: z.array(z.string().trim().min(2).max(80)).min(1),
      weeklySchedule: weeklyScheduleSchema.min(1),
      averageConsultationTimeMinutes: z.coerce.number().int().min(5).max(180),
      appointmentSlotMinutes: z.coerce.number().int().min(5).max(180),
      dailyPatientCapacity: z.coerce.number().int().min(1).max(500).optional(),
      gstNumber: z.string().trim().optional().or(z.literal('')),
      panNumber: z.string().trim().max(40).optional().or(z.literal('')),
      openingHours: z.string().trim().min(3).max(255).optional().or(z.literal('')),
      specialties: z.array(z.string().trim().min(2).max(60)).min(1),
      specialtyOther: z.string().trim().max(120).optional().or(z.literal('')),
      doctorCount: z.coerce.number().int().min(0).max(500).optional(),
      clinicLogoUrl: optionalUploadSchema,
      clinicCoverImageUrl: optionalUploadSchema,
      facilities: z.array(z.string().trim().min(2).max(80)).default([]),
      languagesSpoken: z.array(z.string().trim().min(2).max(80)).default([]),
      paymentMethods: z.array(z.string().trim().min(2).max(80)).min(1),
      insuranceSupported: z.array(z.string().trim().min(2).max(120)).default([]),
      clinicRegistrationNumber: z.string().trim().min(3).max(120),
      licenseDocumentUrl: z.string().trim().min(3).max(255),
      medicalEstablishmentCertificateUrl: z.string().trim().min(3).max(255),
      gstCertificateUrl: optionalUploadSchema,
      panCardUrl: optionalUploadSchema,
      additionalDocuments: z.array(z.string().trim().min(1).max(255)).default([]),
    })
  )
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }

    if (data.clinicType === 'Other' && !data.clinicTypeOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['clinicTypeOther'],
        message: 'Please specify the clinic type',
      });
    }

  });

const doctorRegisterSchema = z
  .object({
    name: z.string().trim().optional(),
    fullName: z.string().trim().optional(),
    phone: z.string(),
    email: z.string().trim().email(),
    password: passwordSchema,
    qualification: z.string().trim().min(2).max(120),
    specialization: z.string().trim().min(2).max(120),
    experience: z.coerce.number().int().min(0).max(60).optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    medicalRegistrationNumber: z.string().trim().min(4).max(120),
    documentUrl: z.string().trim().optional(),
    certificates: z.any().optional(),
    consultationFee: z.coerce.number().min(0),
    onlineConsultationEnabled: z.boolean().optional(),
    onlineAvailable: z.boolean().optional(),
  })
  .transform((data) => ({
    name: data.name || data.fullName || '',
    phone: normalizeMobileNumber(data.phone),
    email: data.email,
    password: data.password,
    qualification: data.qualification,
    specialization: data.specialization,
    experience: data.experience ?? data.experienceYears ?? 0,
    medicalRegistrationNumber: data.medicalRegistrationNumber,
    documentUrl:
      data.documentUrl ||
      (Array.isArray(data.certificates) ? data.certificates[0] : typeof data.certificates === 'string' ? data.certificates : '') ||
      '',
    consultationFee: data.consultationFee,
    onlineConsultationEnabled: data.onlineConsultationEnabled ?? data.onlineAvailable ?? true,
  }))
  .pipe(
    z.object({
      name: z.string().trim().min(2).max(120),
      phone: normalizedPhone(),
      email: z.string().trim().email(),
      password: passwordSchema,
      qualification: z.string().trim().min(2).max(120),
      specialization: z.string().trim().min(2).max(120),
      experience: z.coerce.number().int().min(0).max(60),
      medicalRegistrationNumber: z.string().trim().min(4).max(120),
      documentUrl: z.string().trim().min(0).max(255),
      consultationFee: z.coerce.number().min(0),
      onlineConsultationEnabled: z.boolean().default(true),
    })
  );

const commonLoginSchema = z
  .object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    mobile: z.string().trim().optional(),
    password: z.string().min(1),
  })
  .transform((data) => ({
    identifier: data.identifier || data.email || data.mobile || '',
    password: data.password,
  }))
  .pipe(
    z.object({
      identifier: z.string().trim().min(3).max(160),
      password: z.string().min(1),
    })
  );

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(6),
  newPassword: passwordSchema,
  confirmPassword: z.string().trim().min(8),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }
});

const verifyResetTokenSchema = z.object({
  token: z.string().trim().min(6),
});

const createReceptionistSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().trim().email(),
  password: passwordSchema,
}).transform((data) => ({
  name: data.name || data.fullName || '',
  phone: normalizeMobileNumber(data.phone || data.mobile || ''),
  email: data.email,
  password: data.password,
})).pipe(z.object({
  name: z.string().trim().min(2).max(120),
  phone: normalizedPhone(),
  email: z.string().trim().email(),
  password: passwordSchema,
}));

const adminCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: normalizedPhone(),
  email: z.string().trim().email(),
  password: passwordSchema,
  level: z.enum(['SUPER_ADMIN', 'SUPPORT', 'FINANCE']),
});

const approvalSchema = z.object({
  rejectionReason: z.string().trim().min(3).max(255).optional(),
});

const validateRequest = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  req.body = parsed.data;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  req.query = parsed.data;
  next();
};

module.exports = {
  patientSendOtpSchema,
  patientVerifyOtpSchema,
  clinicOwnerOtpSendSchema,
  clinicOwnerOtpVerifySchema,
  clinicOwnerEmailVerificationSendSchema,
  clinicOwnerEmailOtpVerifySchema,
  clinicOwnerEmailVerificationTokenSchema,
  clinicOwnerRegisterSchema,
  doctorRegisterSchema,
  commonLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyResetTokenSchema,
  createReceptionistSchema,
  adminCreateSchema,
  approvalSchema,
  validateRequest,
  validateQuery,
};
