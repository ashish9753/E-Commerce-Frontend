import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { getErrorMessage } from '../api/client';
import { clearAll as clearApiCache } from '../utils/apiCache';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    clearApiCache(); // drop cached catalog/product data so the next user starts clean
    setUser(null);
  }, []);

  // Listen for token-expiry forced logout
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  // Validate stored session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    authApi.getMe()
      .then(({ data }) => {
        const u = data.data.user;
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password });
      const { user: u, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const register = async ({ name, email, phone, password }) => {
    try {
      const { data } = await authApi.register({ name, email, phone, password });
      const { user: u, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const { data } = await usersApi.updateProfile(updates);
      const u = data.data.user;
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
      return { success: true, user: u };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
