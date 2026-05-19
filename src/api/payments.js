import client from './client';

export const paymentsApi = {
  createOrder: (data) => client.post('/payments/create-order', data),
  verify: (data) => client.post('/payments/verify', data),
};
