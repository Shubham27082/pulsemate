const { compareHash, generateOtp, hashToken, hashValue } = require('./crypto');

const hashPassword = (password) => hashValue(password);
const verifyPassword = (password, passwordHash) => compareHash(password, passwordHash);
const hashOtp = (otp) => hashValue(otp);
const verifyOtpHash = (otp, otpHash) => compareHash(otp, otpHash);

module.exports = {
  hashPassword,
  verifyPassword,
  hashOtp,
  verifyOtpHash,
  generateOtp,
  hashToken,
};
