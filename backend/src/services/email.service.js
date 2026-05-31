const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const isProduction = process.env.NODE_ENV === 'production';
const hasSmtpConfig =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_PORT) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);

const mailProvider = (process.env.EMAIL_PROVIDER || (hasSmtpConfig ? 'smtp' : 'console')).toLowerCase();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || (smtpPort === 465)).toLowerCase() === 'true';
const smtpUser = String(process.env.SMTP_USER || '').trim();
const smtpPass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
const smtpFrom = String(process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '').trim();

let smtpTransporter;

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  if (!hasSmtpConfig) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }

  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false' ? { rejectUnauthorized: false } : undefined,
  });

  return smtpTransporter;
};

const sendViaResend = async ({ to, subject, text, html }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend request failed with status ${response.status}`);
  }

  logger.info(`Resend email sent to ${to} with subject "${subject}"`);
  return response.json();
};

const sendViaSendGrid = async ({ to, subject, text, html }) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`SendGrid request failed with status ${response.status}`);
  }

  return true;
};

const sendViaMailgun = async ({ to, subject, text, html }) => {
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;
  const from = process.env.MAILGUN_FROM_EMAIL;
  const formData = new URLSearchParams();
  formData.set('from', from);
  formData.set('to', to);
  formData.set('subject', subject);
  formData.set('text', text);
  formData.set('html', html);

  const auth = Buffer.from(`api:${apiKey}`).toString('base64');
  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`Mailgun request failed with status ${response.status}`);
  }

  return true;
};

const sendTransactionalEmail = async ({ to, subject, text, html }) => {
  if (!isProduction) {
    logger.info(`Email preview -> to: ${to}, subject: ${subject}`);
    logger.info(text);
  }

  if (mailProvider === 'smtp') {
    const transporter = getSmtpTransporter();
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      text,
      html,
    });
    logger.info(`SMTP email sent to ${to} with subject "${subject}"`);
    return true;
  }

  if (typeof fetch !== 'function') {
    return false;
  }

  if (mailProvider === 'resend' && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    return sendViaResend({ to, subject, text, html });
  }

  if (mailProvider === 'sendgrid' && process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    return sendViaSendGrid({ to, subject, text, html });
  }

  if (mailProvider === 'mailgun' && process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN && process.env.MAILGUN_FROM_EMAIL) {
    return sendViaMailgun({ to, subject, text, html });
  }

  return false;
};

const logEmail = (subject, email, body) => {
  logger.info(`${subject} queued for ${email}`);
  if (!isProduction) {
    logger.info(body);
  }
};

const sendPasswordResetEmail = async (userEmail, resetLink, userName) => {
  const body = [
    `Hello ${userName || 'there'},`,
    '',
    'We received a request to reset your PulseMate account password.',
    '',
    'Click the link below to reset your password:',
    resetLink,
    '',
    'This link will expire in 15 minutes.',
    '',
    'If you did not request this password reset, you can safely ignore this email.',
    '',
    'For security, never share this link with anyone.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  logEmail('Reset your PulseMate password', userEmail, body);
  return true;
};

const sendPasswordChangedEmail = async (userEmail, userName) => {
  const body = [
    `Hello ${userName || 'there'},`,
    '',
    'Your PulseMate account password was successfully changed.',
    '',
    'If this was you, no action is needed.',
    '',
    'If this was not you, contact support immediately.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  logEmail('Your PulseMate password was changed', userEmail, body);
  return true;
};

const sendSuperAdminPasswordChangedSecurityEmail = async (userEmail, userName) => {
  const body = [
    `Hello ${userName || 'there'},`,
    '',
    'Your PulseMate Super Admin password was successfully changed.',
    '',
    'If this was not you, contact the technical owner immediately.',
    '',
    'Thanks,',
    'PulseMate Security Team',
  ].join('\n');

  logEmail('Security Alert: PulseMate Super Admin Password Reset', userEmail, body);
  return true;
};

const sendSuperAdminResetEmail = async (userEmail, resetLink, userName) => {
  const body = [
    `Hello ${userName || 'there'},`,
    '',
    'A password reset was requested for your PulseMate Super Admin account.',
    '',
    'Reset link:',
    resetLink,
    '',
    'This link will expire in 10 minutes.',
    '',
    'If this was not you, contact the technical owner immediately and do not click the link.',
    '',
    'Thanks,',
    'PulseMate Security Team',
  ].join('\n');

  logEmail('Security Alert: PulseMate Super Admin Password Reset', userEmail, body);
  return true;
};

const sendClinicOwnerVerificationEmail = async (userEmail, verificationLink, userName) => {
  const subject = 'Verify your PulseMate clinic registration email';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    'Please verify your email address to continue your PulseMate clinic registration.',
    '',
    'Click the link below to verify your email:',
    verificationLink,
    '',
    'This link will expire in 10 minutes.',
    '',
    'If you did not start a clinic registration, you can ignore this email.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName || 'there'},</p>
      <p>Please verify your email address to continue your PulseMate clinic registration.</p>
      <p><a href="${verificationLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Verify email</a></p>
      <p style="color:#64748b;font-size:14px">This link will expire in 10 minutes.</p>
      <p style="color:#64748b;font-size:14px">If you did not start a clinic registration, you can ignore this email.</p>
    </div>
  `;

  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) {
    logEmail(subject, userEmail, text);
  }
  logger.info(`Legacy clinic email verification link: ${verificationLink}`);
  return true;
};

const sendClinicOwnerVerificationOtpEmail = async (userEmail, otp, userName) => {
  const subject = 'Your PulseMate clinic verification code';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    'Please use the OTP below to verify your email address for your PulseMate clinic registration.',
    '',
    `Email OTP: ${otp}`,
    '',
    'This OTP will expire in 10 minutes.',
    '',
    'If you did not start a clinic registration, you can ignore this email.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName || 'there'},</p>
      <p>Please use the OTP below to verify your email address for your PulseMate clinic registration.</p>
      <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 18px;font-size:24px;font-weight:700;letter-spacing:0.28em;color:#1d4ed8">${otp}</div>
      <p style="color:#64748b;font-size:14px">This OTP will expire in 10 minutes.</p>
      <p style="color:#64748b;font-size:14px">If you did not start a clinic registration, you can ignore this email.</p>
    </div>
  `;

  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) {
    logEmail(subject, userEmail, text);
  }
  return true;
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendSuperAdminPasswordChangedSecurityEmail,
  sendSuperAdminResetEmail,
  sendClinicOwnerVerificationEmail,
  sendClinicOwnerVerificationOtpEmail,
  sendTransactionalEmail,
};
