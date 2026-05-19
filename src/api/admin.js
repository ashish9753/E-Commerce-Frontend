import client from './client';

export const adminApi = {
  // Users
  getUsers: (params) => client.get('/users', { params }),
  blockUser: (id) => client.patch(`/users/${id}/block`),
  deleteUser: (id) => client.delete(`/users/${id}`),

  // Employees
  getEmployees: (params) => client.get('/employees', { params }),
  verifyEmployee: (id) => client.patch(`/employees/${id}/verify`),
  getEmployeeById: (id) => client.get(`/employees/${id}`),

  // Orders
  getOrders: (params) => client.get('/orders', { params }),
  getOrderStats: () => client.get('/orders/admin/stats'),
  updateOrderStatus: (id, data) => client.patch(`/orders/${id}/status`, data),
  forceRefund: (id, data) => client.post(`/orders/${id}/force-refund`, data),

  // Payments
  getPayments: () => client.get('/payments'),
};
