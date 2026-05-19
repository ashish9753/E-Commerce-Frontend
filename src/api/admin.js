import client from './client';

export const adminApi = {
  // Users
  getUsers: (params) => client.get('/users', { params }),
  blockUser: (id) => client.patch(`/users/${id}/block`),
  deleteUser: (id) => client.delete(`/users/${id}`),

  // Sellers
  getSellers: (params) => client.get('/sellers', { params }),
  verifySeller: (id) => client.patch(`/sellers/${id}/verify`),
  getSellerById: (id) => client.get(`/sellers/${id}`),

  // Orders
  getOrders: (params) => client.get('/orders', { params }),
  getOrderStats: () => client.get('/orders/admin/stats'),
  updateOrderStatus: (id, data) => client.patch(`/orders/${id}/status`, data),

  // Payments
  getPayments: () => client.get('/payments'),
};
