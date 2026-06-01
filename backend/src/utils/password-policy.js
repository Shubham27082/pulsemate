const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const validatePasswordStrength = (password) => {
  if (!PASSWORD_REGEX.test(String(password || ''))) {
    const error = new Error(
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
    );
    error.status = 400;
    throw error;
  }
};

module.exports = { PASSWORD_REGEX, validatePasswordStrength };
