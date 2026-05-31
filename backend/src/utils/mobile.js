const normalizeMobileNumber = (value) => {
  if (typeof value !== 'string') return value;

  const sanitized = value.trim().replace(/[\s\-()]/g, '');
  const digits = sanitized.replace(/\D/g, '');

  if (!digits) return '';

  if (sanitized.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return digits;
};

module.exports = {
  normalizeMobileNumber,
};
