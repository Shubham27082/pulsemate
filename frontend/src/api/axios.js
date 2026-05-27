import axios from 'axios';
import {
  PORTAL_CONFIG,
  clearPortalSession,
  getPortalFromPath,
  readPortalSession,
  writePortalSession,
} from '../utils/authScope';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const portalLocks = new Map();
const portalQueues = new Map();

const processQueue = (portal, error, token = null) => {
  const queue = portalQueues.get(portal) || [];
  queue.forEach((pending) => {
    if (error) pending.reject(error);
    else pending.resolve(token);
  });
  portalQueues.set(portal, []);
};

api.interceptors.request.use((config) => {
  const portal = config.headers['X-Auth-Portal'] || getPortalFromPath();
  config.headers['X-Auth-Portal'] = portal;
  const session = readPortalSession(portal);
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const portal = originalRequest.headers?.['X-Auth-Portal'] || getPortalFromPath();

    if (error.response?.status === 401 && !originalRequest._retry && PORTAL_CONFIG[portal]) {
      if (portalLocks.get(portal)) {
        return new Promise((resolve, reject) => {
          const queue = portalQueues.get(portal) || [];
          queue.push({ resolve, reject });
          portalQueues.set(portal, queue);
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      portalLocks.set(portal, true);
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}${PORTAL_CONFIG[portal].loginPath}/refresh-token`,
          {},
          {
            withCredentials: true,
            headers: { 'X-Auth-Portal': portal },
          }
        );

        const { accessToken, user } = response.data.data;
        const current = readPortalSession(portal) || {};
        const nextState = {
          ...current,
          user: user || current.user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        };
        writePortalSession(portal, nextState);
        processQueue(portal, null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(portal, refreshError, null);
        clearPortalSession(portal);
        window.location.href = `/login/${portal === 'clinic-owner' ? 'clinic' : portal}`;
        return Promise.reject(refreshError);
      } finally {
        portalLocks.set(portal, false);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
