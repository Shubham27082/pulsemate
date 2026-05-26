import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Change BASE_URL to match your environment ──────────────────────────────
// Android emulator : 'http://10.0.2.2:5000/api'
// iOS simulator    : 'http://localhost:5000/api'
// Real device      : 'http://<YOUR_MACHINE_LAN_IP>:5000/api'
//                    (run `ipconfig` on Windows / `ifconfig` on Mac to find it)
export const BASE_URL = 'http://192.168.31.240:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
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
