/**
 * Firebase Admin SDK initializer.
 * Uses FIREBASE_SERVICE_ACCOUNT_JSON env var (single-line JSON string).
 * Falls back to console-only logging if config is missing.
 */
const logger = require('./logger');

let adminApp = null;
let isInitialized = false;

const initFirebase = () => {
  if (isInitialized) return adminApp;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    logger.warn('Firebase not configured: FIREBASE_SERVICE_ACCOUNT_JSON is missing. Push notifications will be skipped.');
    isInitialized = true;
    return null;
  }

  try {
    const admin = require('firebase-admin');

    if (admin.apps.length > 0) {
      adminApp = admin.apps[0];
      isInitialized = true;
      return adminApp;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isInitialized = true;
    logger.info('Firebase Admin SDK initialized');
    return adminApp;
  } catch (error) {
    logger.error('Firebase initialization failed:', error.message);
    isInitialized = true;
    return null;
  }
};

const getFirebaseAdmin = () => {
  if (!isInitialized) initFirebase();
  return adminApp;
};

const isFirebaseReady = () => {
  if (!isInitialized) initFirebase();
  return adminApp !== null;
};

module.exports = { initFirebase, getFirebaseAdmin, isFirebaseReady };
