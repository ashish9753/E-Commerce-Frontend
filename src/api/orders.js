import client from './client';

export const ordersApi = {
  place: (data) => client.post('/orders', data),
  getMy: (params) => client.get('/orders/my', { params }),
  getById: (id) => client.get(`/orders/${id}`),
  cancel: (id) => client.patch(`/orders/${id}/cancel`),
};
