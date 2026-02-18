import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/api/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(payload) {
        const response = await api.post('/api/auth/login', payload);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return response.data;
      },
      async register(payload) {
        const response = await api.post('/api/auth/register', payload);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setUser(response.data.user);
        }
        return response.data;
      },
      async verifyEmail(payload) {
        const response = await api.post('/api/auth/verify-email', payload);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setUser(response.data.user);
        }
        return response.data;
      },
      async resendVerification(payload) {
        const response = await api.post('/api/auth/resend-verification', payload);
        return response.data;
      },
      logout() {
        localStorage.removeItem('token');
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
