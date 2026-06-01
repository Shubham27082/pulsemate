const Joi = require('joi');

const bookAppointmentSchema = Joi.object({
  doctorId: Joi.string().required(),
  clinicId: Joi.string().uuid().required(),
  appointmentType: Joi.string().valid('ONLINE', 'OFFLINE').default('OFFLINE'),
  appointmentDate: Joi.date().iso().min('now').required(),
  slotTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  symptoms: Joi.string().max(1000).optional().allow(''),
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

module.exports = { bookAppointmentSchema, validate };
