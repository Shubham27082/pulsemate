const Joi = require('joi');

const createClinicSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  phone: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  openingTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  closingTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  description: Joi.string().optional().allow(''),
});

const updateClinicSchema = createClinicSchema.fork(
  ['name'],
  (schema) => schema.optional()
);

const addStaffSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  mobile: Joi.string().optional(),
  role: Joi.string().valid('DOCTOR', 'RECEPTIONIST').required(),
  name: Joi.string().optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  password: Joi.string().min(6).optional().allow(''),
});

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

module.exports = { createClinicSchema, updateClinicSchema, addStaffSchema, validate };
