/**
 * SMS / WhatsApp OTP delivery service.
 *
 * Supported providers (set SMS_PROVIDER in .env):
 *   mock      — logs OTP to console only (default, safe for dev)
 *   msg91     — MSG91 Flow API (recommended for India)
 *   2factor   — 2Factor.in (simple India SMS + optional WhatsApp)
 *   twilio    — Twilio SMS (international)
 *
 * WhatsApp (set WHATSAPP_PROVIDER in .env):
 *   2factor   — 2Factor.in WhatsApp API (same API key as SMS)
 *   twilio    — Twilio WhatsApp sandbox/number
 *
 * When WHATSAPP_PROVIDER is set, OTP is sent on BOTH SMS and WhatsApp.
 * All providers fall back to mock if their API key is missing.
 */
const logger = require('../config/logger');

// Read once at module load — avoids repeated env lookups
const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'mock').toLowerCase().trim();
const WHATSAPP_PROVIDER = (process.env.WHATSAPP_PROVIDER || '').toLowerCase().trim();
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'PULSE';
const SMS_TEMPLATE_ID = process.env.SMS_TEMPLATE_ID || '';
const WHATSAPP_TEMPLATE_ID = process.env.WHATSAPP_TEMPLATE_ID || '';

const OTP_MESSAGE = (otp) =>
  `Your PulseMate OTP is ${otp}. Valid for 5 minutes. Do not share it with anyone.`;

// ─────────────────────────────────────────────────────────────────────────────
//  Public entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send an OTP via SMS and optionally WhatsApp.
 * @param {string} mobile  E.164 format with country code, e.g. +919876543210
 * @param {string} otp     6-digit string
 */
const sendOtpSms = async (mobile, otp) => {
  // Send SMS via configured provider
  const smsResult = await sendSms(mobile, otp);

  // Also send via WhatsApp if configured (fire-and-forget, never blocks SMS)
  if (WHATSAPP_PROVIDER) {
    sendWhatsApp(mobile, otp).catch((err) =>
      logger.warn(`[WhatsApp] Delivery failed (non-blocking): ${err.message}`)
    );
  }

  return smsResult;
};

// Send SMS only
const sendSms = async (mobile, otp) => {
  switch (SMS_PROVIDER) {
    case 'msg91': return sendViaMSG91(mobile, otp);
    case '2factor': return sendVia2Factor(mobile, otp);
    case 'twilio': return sendViaTwilio(mobile, otp);
    case 'mock':
    default: return sendMock(mobile, otp);
  }
};

// Send WhatsApp only
const sendWhatsApp = async (mobile, otp) => {
  switch (WHATSAPP_PROVIDER) {
    case '2factor': return sendVia2FactorWhatsApp(mobile, otp);
    case 'twilio': return sendViaTwilioWhatsApp(mobile, otp);
    default:
      logger.warn(`[WhatsApp] Unknown provider: ${WHATSAPP_PROVIDER}`);
      return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Mock — development fallback
// ─────────────────────────────────────────────────────────────────────────────

const sendMock = async (mobile, otp) => {
  logger.info(`[SMS-MOCK] To: ${mobile} | OTP: ${otp}`);
  // Also print to stdout so it's impossible to miss in terminal
  console.log('\n' + '─'.repeat(50));
  console.log(`  📱 DEV OTP  →  ${mobile}`);
  console.log(`  Code: ${otp}`);
  console.log('─'.repeat(50) + '\n');
  return { success: true, provider: 'mock' };
};

// ─────────────────────────────────────────────────────────────────────────────
//  MSG91  (recommended for India production)
//
//  How to get keys:
//  1. Sign up at https://msg91.com
//  2. Dashboard → API → Auth Key  → copy into SMS_API_KEY
//  3. Dashboard → SMS → Sender IDs → create "PULSE" → copy into SMS_SENDER_ID
//  4. Dashboard → SMS → Templates → create OTP template approved by DLT
//     Template example: "Your PulseMate OTP is ##OTP##. Valid 5 min. -PULSE"
//     After DLT approval copy the Template ID into SMS_TEMPLATE_ID
//
//  MSG91 uses its Flow API for OTP. The flow_id maps to your OTP template.
//  Variable name inside the template must be "otp" (MSG91 default).
// ─────────────────────────────────────────────────────────────────────────────

const sendViaMSG91 = async (mobile, otp) => {
  if (!SMS_API_KEY) {
    logger.warn('[MSG91] SMS_API_KEY missing — falling back to mock');
    return sendMock(mobile, otp);
  }
  if (!SMS_TEMPLATE_ID) {
    logger.warn('[MSG91] SMS_TEMPLATE_ID (flow_id) missing — falling back to mock');
    return sendMock(mobile, otp);
  }

  // MSG91 expects mobile without leading +
  const cleanMobile = mobile.replace(/^\+/, '');

  const payload = JSON.stringify({
    flow_id: SMS_TEMPLATE_ID,   // your OTP flow/template id
    sender: SMS_SENDER_ID,
    mobiles: cleanMobile,       // can be comma-separated for bulk
    otp,                         // variable name MSG91 replaces in template
  });

  logger.info(`[MSG91] Sending OTP to ${cleanMobile}`);

  return new Promise((resolve, reject) => {
    const https = require('https');

    const options = {
      hostname: 'control.msg91.com',
      path: '/api/v5/flow/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        authkey: SMS_API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = { type: 'error', message: raw }; }

        if (parsed.type === 'success') {
          logger.info(`[MSG91] OTP sent. Request id: ${parsed.request_id}`);
          resolve({ success: true, provider: 'msg91', requestId: parsed.request_id });
        } else {
          logger.error(`[MSG91] Send failed: ${JSON.stringify(parsed)}`);
          // Don't throw — return failure so caller can decide
          resolve({ success: false, provider: 'msg91', error: parsed.message || raw });
        }
      });
    });

    req.on('error', (err) => {
      logger.error(`[MSG91] Network error: ${err.message}`);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  2Factor  (simple, cheap, India-only)
//
//  How to get keys:
//  1. Sign up at https://2factor.in
//  2. Dashboard → API Keys → copy your API key into SMS_API_KEY
//  3. (Optional) create a custom OTP template in Dashboard → SMS Templates
//     copy the Template Name into SMS_TEMPLATE_ID
//     Leave SMS_TEMPLATE_ID blank to use 2Factor's default auto OTP template.
//  4. SMS_SENDER_ID is not used by 2Factor — you can leave it blank.
//
//  2Factor auto-generates and verifies OTP unless you pass your own OTP.
//  We pass our own OTP so we control the code (for consistent UX).
// ─────────────────────────────────────────────────────────────────────────────

const sendVia2Factor = async (mobile, otp) => {
  if (!SMS_API_KEY) {
    logger.warn('[2Factor] SMS_API_KEY missing — falling back to mock');
    return sendMock(mobile, otp);
  }

  // 2Factor expects 10-digit Indian mobile without country code
  const cleanMobile = mobile.replace(/^\+91/, '').replace(/^\+/, '');

  // Path: /API/V1/{apikey}/SMS/{mobile}/{otp}/{template_name}
  const templatePart = SMS_TEMPLATE_ID ? `/${encodeURIComponent(SMS_TEMPLATE_ID)}` : '';
  const path = `/API/V1/${SMS_API_KEY}/SMS/${cleanMobile}/${otp}${templatePart}`;

  logger.info(`[2Factor] Sending OTP to ${cleanMobile}`);

  return new Promise((resolve, reject) => {
    const https = require('https');

    const options = {
      hostname: '2factor.in',
      path,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = { Status: 'Error', Details: raw }; }

        if (parsed.Status === 'Success') {
          logger.info(`[2Factor] OTP sent. Session id: ${parsed.Details}`);
          resolve({ success: true, provider: '2factor', sessionId: parsed.Details });
        } else {
          logger.error(`[2Factor] Send failed: ${JSON.stringify(parsed)}`);
          resolve({ success: false, provider: '2factor', error: parsed.Details || raw });
        }
      });
    });

    req.on('error', (err) => {
      logger.error(`[2Factor] Network error: ${err.message}`);
      reject(err);
    });

    req.end();
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  Twilio  (international, already installed as dependency)
//
//  How to get keys:
//  1. Sign up at https://twilio.com
//  2. Console → Account Info → Account SID + Auth Token
//  3. Buy a phone number → copy into SMS_SENDER_ID (e.g. +12015551234)
//  Set SMS_PROVIDER=twilio and use:
//    SMS_API_KEY=ACxxxxxxxxxxxxxxxx:your_auth_token   (SID:TOKEN combined)
//    SMS_SENDER_ID=+12015551234
// ─────────────────────────────────────────────────────────────────────────────

const sendViaTwilio = async (mobile, otp) => {
  if (!SMS_API_KEY) {
    logger.warn('[Twilio] SMS_API_KEY missing — falling back to mock');
    return sendMock(mobile, otp);
  }

  const [accountSid, authToken] = SMS_API_KEY.includes(':')
    ? SMS_API_KEY.split(':')
    : [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN];

  if (!accountSid || !authToken) {
    logger.warn('[Twilio] Account SID or Auth Token missing — falling back to mock');
    return sendMock(mobile, otp);
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: OTP_MESSAGE(otp),
      from: SMS_SENDER_ID || process.env.TWILIO_PHONE_NUMBER,
      to: mobile,
    });

    logger.info(`[Twilio] OTP sent. SID: ${message.sid}`);
    return { success: true, provider: 'twilio', messageSid: message.sid };
  } catch (err) {
    logger.error(`[Twilio] Send failed: ${err.message}`);
    return { success: false, provider: 'twilio', error: err.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  2Factor WhatsApp
//
//  Uses the same API key as 2Factor SMS.
//  2Factor WhatsApp API: GET /API/V1/{apikey}/WHATSAPP/{mobile}/{otp}/{template}
//
//  How to enable:
//  1. Log into https://2factor.in
//  2. Dashboard → WhatsApp → Enable WhatsApp OTP
//  3. Set WHATSAPP_PROVIDER=2factor in .env
//  4. Optionally set WHATSAPP_TEMPLATE_ID to your custom WhatsApp template name
//     Leave blank to use 2Factor's default WhatsApp OTP template.
// ─────────────────────────────────────────────────────────────────────────────

const sendVia2FactorWhatsApp = async (mobile, otp) => {
  if (!SMS_API_KEY) {
    logger.warn('[2Factor-WA] SMS_API_KEY missing — skipping WhatsApp');
    return null;
  }

  // 2Factor expects 10-digit Indian mobile without country code
  const cleanMobile = mobile.replace(/^\+91/, '').replace(/^\+/, '');
  const templatePart = WHATSAPP_TEMPLATE_ID ? `/${encodeURIComponent(WHATSAPP_TEMPLATE_ID)}` : '';
  const path = `/API/V1/${SMS_API_KEY}/WHATSAPP/${cleanMobile}/${otp}${templatePart}`;

  logger.info(`[2Factor-WA] Sending WhatsApp OTP to ${cleanMobile}`);

  return new Promise((resolve) => {
    const https = require('https');

    const req = https.request(
      { hostname: '2factor.in', path, method: 'GET' },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(raw); } catch { parsed = { Status: 'Error', Details: raw }; }

          if (parsed.Status === 'Success') {
            logger.info(`[2Factor-WA] WhatsApp OTP sent. Session: ${parsed.Details}`);
            resolve({ success: true, provider: '2factor-whatsapp', sessionId: parsed.Details });
          } else {
            logger.warn(`[2Factor-WA] Send failed: ${JSON.stringify(parsed)}`);
            resolve({ success: false, provider: '2factor-whatsapp', error: parsed.Details || raw });
          }
        });
      }
    );

    req.on('error', (err) => {
      logger.warn(`[2Factor-WA] Network error: ${err.message}`);
      resolve({ success: false, provider: '2factor-whatsapp', error: err.message });
    });

    req.end();
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  Twilio WhatsApp
//
//  How to enable:
//  1. Twilio Console → Messaging → Try it out → Send a WhatsApp message
//  2. Enable the Twilio Sandbox for WhatsApp (free testing)
//     OR buy a WhatsApp-enabled Twilio number for production
//  3. Set:
//       SMS_PROVIDER=twilio (for SMS fallback)
//       WHATSAPP_PROVIDER=twilio
//       SMS_API_KEY=ACxxxxxxxx:your_auth_token
//       TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (sandbox number)
// ─────────────────────────────────────────────────────────────────────────────

const sendViaTwilioWhatsApp = async (mobile, otp) => {
  const [accountSid, authToken] = (SMS_API_KEY || '').includes(':')
    ? SMS_API_KEY.split(':')
    : [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN];

  if (!accountSid || !authToken) {
    logger.warn('[Twilio-WA] Account SID or Auth Token missing — skipping WhatsApp');
    return null;
  }

  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  // Ensure number is in whatsapp: format
  const to = mobile.startsWith('whatsapp:') ? mobile : `whatsapp:${mobile}`;

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: OTP_MESSAGE(otp),
      from,
      to,
    });

    logger.info(`[Twilio-WA] WhatsApp OTP sent. SID: ${message.sid}`);
    return { success: true, provider: 'twilio-whatsapp', messageSid: message.sid };
  } catch (err) {
    logger.warn(`[Twilio-WA] Send failed: ${err.message}`);
    return { success: false, provider: 'twilio-whatsapp', error: err.message };
  }
};

module.exports = { sendOtpSms };
