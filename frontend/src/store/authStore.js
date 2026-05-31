import { create } from 'zustand';
import { getMe, logout as logoutApi } from '../api/auth.api';

const normalizeUser = (user) =>
  user
    ? {
        ...user,
        mobile: user.phone ?? user.mobile ?? '',
        approvalStatus: user.status ?? user.approvalStatus ?? '',
      }
    : null;

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) =>
    set({
      user: normalizeUser(user),
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  updateUser: (patch) =>
    set((state) => ({
      user: state.user ? normalizeUser({ ...state.user, ...patch }) : state.user,
    })),

  logout: async () => {
    try {
      await logoutApi();
    } catch (_) {
      // noop
    }

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    set((state) => ({ ...state, isLoading: true }));
    try {
      const response = await getMe();
      const { user } = response.data.data;
      set({
        user: normalizeUser(user),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (_) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

export default useAuthStore;
