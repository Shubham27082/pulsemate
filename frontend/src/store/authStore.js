import { create } from 'zustand';
import { getMe, getPortalForRole, logout as logoutApi } from '../api/auth.api';
import {
  PORTAL_CONFIG,
  clearPortalSession,
  getPortalFromPath,
  readPortalSession,
  writePortalSession,
} from '../utils/authScope';

const emptyPortalState = () => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
});

const initialSessions = Object.fromEntries(
  Object.keys(PORTAL_CONFIG).map((portal) => [portal, readPortalSession(portal) || emptyPortalState()])
);

const useAuthStore = create((set, get) => ({
  activePortal: getPortalFromPath(),
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  sessions: initialSessions,

  setActivePortal: (portal) => {
    const current = get().sessions[portal] || emptyPortalState();
    set({
      activePortal: portal,
      user: current.user,
      accessToken: current.accessToken,
      isAuthenticated: current.isAuthenticated,
      isLoading: current.isLoading,
    });
  },

  setAuth: (user, accessToken, portalOverride = undefined) => {
    const portal = portalOverride || getPortalForRole(user?.role);
    const nextState = {
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    };
    writePortalSession(portal, nextState);
    set((state) => ({
      activePortal: portal,
      user: nextState.user,
      accessToken: nextState.accessToken,
      isAuthenticated: nextState.isAuthenticated,
      isLoading: nextState.isLoading,
      sessions: {
        ...state.sessions,
        [portal]: nextState,
      },
    }));
  },

  clearAuth: (portal = getPortalFromPath()) => {
    clearPortalSession(portal);
    set((state) => ({
      ...(state.activePortal === portal
        ? {
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          }
        : {}),
      sessions: {
        ...state.sessions,
        [portal]: emptyPortalState(),
      },
    }));
  },

  updateUser: (userData, portal = getPortalFromPath()) => {
    const current = get().sessions[portal] || emptyPortalState();
    const nextState = { ...current, user: { ...current.user, ...userData } };
    writePortalSession(portal, nextState);
    set((state) => ({
      ...(state.activePortal === portal
        ? {
            user: nextState.user,
            accessToken: nextState.accessToken,
            isAuthenticated: nextState.isAuthenticated,
            isLoading: nextState.isLoading,
          }
        : {}),
      sessions: {
        ...state.sessions,
        [portal]: nextState,
      },
    }));
  },

  logout: async (portal = getPortalFromPath()) => {
    try {
      await logoutApi(portal);
    } catch (_) {}
    clearPortalSession(portal);
    set((state) => ({
      ...(state.activePortal === portal
        ? {
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          }
        : {}),
      sessions: {
        ...state.sessions,
        [portal]: emptyPortalState(),
      },
    }));
  },

  checkAuth: async (portal = getPortalFromPath()) => {
    const current = get().sessions[portal] || readPortalSession(portal) || emptyPortalState();
    if (!current.accessToken) {
      set((state) => ({
        ...(state.activePortal === portal
          ? {
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            }
          : {}),
        sessions: {
          ...state.sessions,
          [portal]: { ...emptyPortalState(), isLoading: false },
        },
      }));
      return;
    }

      set((state) => ({
        ...(state.activePortal === portal
          ? {
              user: current.user,
              accessToken: current.accessToken,
              isAuthenticated: current.isAuthenticated,
              isLoading: true,
            }
          : {}),
        sessions: {
          ...state.sessions,
          [portal]: { ...current, isLoading: true },
      },
    }));

    try {
      const response = await getMe(portal);
      const { user } = response.data.data;
      const nextState = {
        ...current,
        user,
        isAuthenticated: true,
        isLoading: false,
      };
      writePortalSession(portal, nextState);
      set((state) => ({
        ...(state.activePortal === portal
          ? {
              user: nextState.user,
              accessToken: nextState.accessToken,
              isAuthenticated: nextState.isAuthenticated,
              isLoading: nextState.isLoading,
            }
          : {}),
        sessions: {
          ...state.sessions,
          [portal]: nextState,
        },
      }));
    } catch (_) {
      clearPortalSession(portal);
      set((state) => ({
        ...(state.activePortal === portal
          ? {
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            }
          : {}),
        sessions: {
          ...state.sessions,
          [portal]: emptyPortalState(),
        },
      }));
    }
  },
}));

export default useAuthStore;
