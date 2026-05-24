import client from './client';

export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  logout: () => client.post('/auth/logout'),
  // Refresh token rides in the httpOnly cookie — no body argument needed.
  refreshToken: () => client.post('/auth/refresh-token'),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => client.patch(`/auth/reset-password/${token}`, { password }),
  getMe: () => client.get('/auth/me'),
};
