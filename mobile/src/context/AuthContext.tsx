import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY, USER_KEY, PROFILE_KEY } from '../services/api';
import { PatientProfile, User } from '../types';

interface AuthContextType {
  user: User | null;
  patient: PatientProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  dob: string;
  gender: string;
  blood_group: string;
  phone: string;
  address: string;
  emergency_contact: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from AsyncStorage on app launch
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);

        if (storedToken && storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          if (parsedUser.role !== 'patient') {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PROFILE_KEY]);
          } else {
            setToken(storedToken);
            setUser(parsedUser);
            if (storedProfile) {
              setPatient(JSON.parse(storedProfile));
            }

            // Verify token validity with backend
            try {
              const res = await api.get('/auth/me');
              if (res.data?.profile) {
                setPatient(res.data.profile);
                await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(res.data.profile));
              }
            } catch (err) {
              console.warn('Session verification failed, logging out:', err);
              await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PROFILE_KEY]);
              setToken(null);
              setUser(null);
              setPatient(null);
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore authentication session:', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email: email.trim(), password });
    const { token: receivedToken, user: receivedUser, profile } = res.data;

    if (receivedUser.role !== 'patient') {
      throw new Error(
        `Access Restricted: This mobile application is for patients only. ${receivedUser.role.toUpperCase()} accounts must access CareHub via the web dashboard.`
      );
    }

    await AsyncStorage.setItem(TOKEN_KEY, receivedToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
    if (profile) {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }

    setToken(receivedToken);
    setUser(receivedUser);
    setPatient(profile || null);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', {
      ...data,
      email: data.email.trim(),
    });
    const { token: receivedToken, user: receivedUser, profile } = res.data;

    await AsyncStorage.setItem(TOKEN_KEY, receivedToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
    if (profile) {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }

    setToken(receivedToken);
    setUser(receivedUser);
    setPatient(profile || null);
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PROFILE_KEY]);
    } catch (e) {
      console.warn('Storage cleanup error:', e);
    }
    setToken(null);
    setUser(null);
    setPatient(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.profile) {
        setPatient(res.data.profile);
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(res.data.profile));
      }
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        token,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
