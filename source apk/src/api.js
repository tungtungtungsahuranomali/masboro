import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default API URL — fallback jika tidak ada custom
const DEFAULT_API_URL = 'http://157.15.40.90/ligat-api/api';

// Inisialisasi baseURL dari AsyncStorage
let API_URL = DEFAULT_API_URL;

(async () => {
  try {
    const custom = await AsyncStorage.getItem('custom_api_url');
    if (custom) {
      API_URL = custom;
      api.defaults.baseURL = custom;
    }
  } catch (e) {}
})();

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Fungsi untuk update baseURL secara dinamis (dipanggil dari DevOptions)
export const updateBaseURL = async (newUrl) => {
  if (!newUrl || newUrl === API_URL) return;
  API_URL = newUrl;
  api.defaults.baseURL = newUrl;
  await AsyncStorage.setItem('custom_api_url', newUrl);
};

export const resetBaseURL = async () => {
  API_URL = DEFAULT_API_URL;
  api.defaults.baseURL = DEFAULT_API_URL;
  await AsyncStorage.removeItem('custom_api_url');
};

// Interceptor: tambahkan token ke setiap request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: handle 401 + auto-retry untuk GET yang timeout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }

    const config = error.config;
    if (
      !config._retried &&
      config.method === 'get' &&
      (error.code === 'ECONNABORTED' || !error.response)
    ) {
      config._retried = true;
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_URL, DEFAULT_API_URL };
