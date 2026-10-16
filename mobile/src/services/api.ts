import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'carehub_patient_token';
export const USER_KEY = 'carehub_patient_user';
export const PROFILE_KEY = 'carehub_patient_profile';

// Default to computer's LAN IP if environment variable is not set
const DEFAULT_API_URL = 'http://192.168.1.44:5000/api';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

console.log('[CareHub Mobile] Initialized with API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected network error occurred.';
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        message = `Unable to connect to CareHub server at ${API_BASE_URL}. Ensure the backend is running and your phone is connected to the same Wi-Fi network.`;
      } else {
        message = error.message;
      }
    }
    const customError = new Error(message);
    (customError as any).status = error.response?.status;
    (customError as any).originalError = error;
    return Promise.reject(customError);
  }
);

export default api;
