import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── API URL resolution ─────────────────────────────────────────────────────
// Dev  : uses extra.apiUrl from app.json  (tunnel URL for cross-network testing)
// Prod : uses extra.apiUrlProd from app.json (your deployed backend)
// To switch, update app.json and reload the bundle.
const isDev = __DEV__;
export const BASE_URL = isDev
  ? (Constants.expoConfig?.extra?.apiUrl ?? 'http://192.168.43.215:5000/api')
  : (Constants.expoConfig?.extra?.apiUrlProd ?? 'https://YOUR_DEPLOYED_BACKEND_URL/api');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,  // increased for tunnel latency
  headers: {
    'Content-Type': 'application/json',
    // Bypass localtunnel interstitial
    'bypass-tunnel-reminder': 'true',
    // Bypass ngrok browser warning page
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'PulseMateApp/1.0',
  },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
    }
    return Promise.reject(error);
  }
);

export default api;
