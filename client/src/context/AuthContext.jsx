import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const roleHome = {
  admin: '/admin/dashboard',
  receptionist: '/receptionist/dashboard',
  doctor: '/doctor/dashboard',
  patient: '/patient/dashboard',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        setProfile(res.data.profile);
      })
      .catch(() => {
        localStorage.removeItem('hms_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('hms_token', res.data.token);
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('hms_token', res.data.token);
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, login, register, logout, roleHome }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
