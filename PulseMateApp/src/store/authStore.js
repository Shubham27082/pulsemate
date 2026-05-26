import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const t = await SecureStore.getItemAsync('accessToken');
        if (t) {
          setToken(t);
          const res = await getMe();
          setUser(res.data.data.user);
        }
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const signIn = async (accessToken, userData) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    setToken(accessToken);
    setUser(userData);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => setUser((u) => ({ ...u, ...updates }));

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
