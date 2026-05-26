const Joi = require('joi');

const mobileRegex = /^\+?[1-9]\d{9,14}$/;

const sendOtpSchema = Joi.object({
  mobile: Joi.string().pattern(mobileRegex).required().messages({
    'string.pattern.base': 'Please provide a valid mobile number',
    'any.required': 'Mobile number is required',
  }),
  purpose: Joi.string().valid('LOGIN', 'SIGNUP', 'RESET_PASSWORD', 'VERIFY_MOBILE').default('LOGIN'),
});

const verifyOtpSchema = Joi.object({
  mobile: Joi.string().pattern(mobileRegex).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
  }),
  purpose: Joi.string().valid('LOGIN', 'SIGNUP', 'RESET_PASSWORD', 'VERIFY_MOBILE').default('LOGIN'),
  name: Joi.string().min(2).max(100).optional(), // for new patient signup
});

const loginPasswordSchema = Joi.object({
  mobile: Joi.string().pattern(mobileRegex).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).required(),
}).or('mobile', 'email');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
    });
  }
  req.body = value;
  next();
};

module.exports = { sendOtpSchema, verifyOtpSchema, loginPasswordSchema, validate };
