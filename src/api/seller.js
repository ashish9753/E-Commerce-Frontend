import client from './client';

export const sellerApi = {
  getMyProfile: () => client.get('/sellers/me'),
  updateProfile: (data) => client.patch('/sellers/me', data),
  registerSeller: (data) => client.post('/sellers/register', data),

  getMyProducts: (params) => client.get('/products/seller/my-products', { params }),
  createProduct: (data) => client.post('/products', data),
  updateProduct: (id, data) => client.patch(`/products/${id}`, data),
  deleteProduct: (id) => client.delete(`/products/${id}`),
};
