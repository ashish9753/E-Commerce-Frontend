import client from './client';

export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  logout: () => client.post('/auth/logout'),
  refreshToken: (refreshToken) => client.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => client.patch(`/auth/reset-password/${token}`, { password }),
  getMe: () => client.get('/auth/me'),
};
