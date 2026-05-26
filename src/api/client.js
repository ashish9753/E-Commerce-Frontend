import axios from 'axios';

// Single source of truth for the backend URL. Override via VITE_API_BASE_URL
// in `.env` (e.g. for local development against localhost:5000).
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://e-commerce-backend-meb1.onrender.com/api/v1';

const BASE_URL = API_BASE_URL;

// withCredentials so the httpOnly refresh-token cookie is sent along with
// /auth/refresh-token requests. The access token still rides in the
// Authorization header on every other request.
export const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// On 401: try to refresh, then replay request
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    const originalToken = original.headers?.Authorization?.replace('Bearer ', '') || null;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }

      isRefreshing = true;
      try {
        // The refresh token is in an httpOnly cookie — sent automatically via
        // withCredentials. We never see or store it in JS.
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true },
        );
        const newAccess = data.data.accessToken;
        localStorage.setItem('accessToken', newAccess);
        client.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return client(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // A stale request can fail after the user has already logged in again.
        // Only clear auth if the token that failed is still the active token.
        if (!originalToken || localStorage.getItem('accessToken') === originalToken) {
          localStorage.removeItem('accessToken');
          window.dispatchEvent(new CustomEvent('auth:logout', {
            detail: { token: originalToken },
          }));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract error message from backend ApiError format
export function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}

export default client;
