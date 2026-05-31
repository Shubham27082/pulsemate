const Joi = require('joi');
const { PASSWORD_REGEX } = require('../utils/password-policy');
const { normalizeMobileNumber } = require('../utils/mobile');

const mobileRegex = /^\+?[1-9]\d{9,14}$/;
const normalizeMobileField = (value) => normalizeMobileNumber(value);
const mobileField = Joi.string().custom(normalizeMobileField).pattern(mobileRegex).required();
const optionalMobileField = Joi.string().custom(normalizeMobileField).pattern(mobileRegex).optional();

const sendOtpSchema = Joi.object({
  mobile: mobileField,
  purpose: Joi.string().valid('LOGIN', 'SIGNUP', 'RESET_PASSWORD', 'VERIFY_MOBILE').default('LOGIN'),
});

const verifyOtpSchema = Joi.object({
  mobile: mobileField,
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  purpose: Joi.string().valid('LOGIN', 'SIGNUP', 'RESET_PASSWORD', 'VERIFY_MOBILE').default('LOGIN'),
  name: Joi.string().min(2).max(100).optional(),
});

const loginPasswordSchema = Joi.object({
  email: Joi.string().email().optional(),
  mobile: optionalMobileField,
  password: Joi.string().required(),
}).or('email', 'mobile');

const strongPassword = Joi.string().pattern(PASSWORD_REGEX).required().messages({
  'string.pattern.base':
    'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
});

const clinicOwnerRegisterSchema = Joi.object({
  ownerName: Joi.string().min(2).max(120).required(),
  phone: mobileField,
  email: Joi.string().email().required(),
  password: strongPassword,
  clinicName: Joi.string().min(2).max(150).required(),
  clinicType: Joi.string().min(2).max(80).optional(),
  clinicTypeOther: Joi.string().max(120).allow('', null).optional(),
  clinicAddress: Joi.string().min(5).max(255).required(),
  city: Joi.string().min(2).max(80).required(),
  state: Joi.string().min(2).max(80).required(),
  district: Joi.string().min(2).max(80).required(),
  pincode: Joi.string().min(4).max(12).required(),
  clinicPhone: mobileField,
  clinicLicenseDocument: Joi.string().uri().required(),
  gstNumber: Joi.string().allow('', null).optional(),
  openingHours: Joi.string().min(3).max(120).required(),
  specialties: Joi.array().items(Joi.string().min(2).max(60)).min(1).required(),
  specialtyOther: Joi.string().max(120).allow('', null).optional(),
});

const doctorRegisterSchema = Joi.object({
  fullName: Joi.string().min(2).max(120).required(),
  phone: mobileField,
  email: Joi.string().email().required(),
  password: strongPassword,
  qualification: Joi.string().min(2).max(120).required(),
  specialization: Joi.string().min(2).max(120).required(),
  experienceYears: Joi.number().integer().min(0).max(60).required(),
  medicalRegistrationNumber: Joi.string().min(4).max(120).required(),
  certificates: Joi.array().items(Joi.string().uri()).default([]),
  consultationFee: Joi.number().min(0).required(),
  onlineAvailable: Joi.boolean().default(false),
  offlineAvailable: Joi.boolean().default(true),
  bio: Joi.string().allow('', null).max(2000).optional(),
  languagesKnown: Joi.array().items(Joi.string().min(2).max(60)).default([]),
});

const receptionistCreateSchema = Joi.object({
  fullName: Joi.string().min(2).max(120).required(),
  phone: mobileField,
  email: Joi.string().email().required(),
  password: strongPassword,
  assignedClinic: Joi.string().required(),
});

const adminCreateSchema = Joi.object({
  fullName: Joi.string().min(2).max(120).required(),
  phone: mobileField,
  email: Joi.string().email().required(),
  password: strongPassword,
  level: Joi.string().valid('SUPER_ADMIN', 'SUPPORT', 'FINANCE').required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().optional(),
  mobile: optionalMobileField,
}).or('email', 'mobile');

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: strongPassword,
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }
  req.body = value;
  next();
};

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  loginPasswordSchema,
  clinicOwnerRegisterSchema,
  doctorRegisterSchema,
  receptionistCreateSchema,
  adminCreateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validate,
};
