import axios from 'axios';
import type { ApiError } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cf_access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && !original._retry) {
      original._retry = true;
      const next = await (refreshing ?? refreshAccess());
      if (next) {
        original.headers.Authorization = `Bearer ${next}`;
        return api(original);
      }
    }
    const payload = error.response?.data as
      | ApiError
      | { message?: string | string[] }
      | undefined;
    const raw =
      payload && 'error' in payload && payload.error
        ? payload.error.message
        : (payload as { message?: string | string[] } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : raw || 'Something went wrong.';
    return Promise.reject(new Error(message));
  },
);

async function refreshAccess(): Promise<string | null> {
  const refreshToken = sessionStorage.getItem('cf_refresh');
  if (!refreshToken) return null;
  refreshing = axios
    .post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`, {
      refreshToken,
    })
    .then((res) => {
      const access = res.data.data.accessToken as string;
      sessionStorage.setItem('cf_access', access);
      sessionStorage.setItem('cf_refresh', res.data.data.refreshToken);
      return access;
    })
    .catch(() => {
      sessionStorage.removeItem('cf_access');
      sessionStorage.removeItem('cf_refresh');
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export default api;
