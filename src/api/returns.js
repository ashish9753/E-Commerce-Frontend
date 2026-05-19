import client from './client';

export const returnsApi = {
  // Customer
  submit:           (data)     => client.post('/returns', data),
  getMy:            ()         => client.get('/returns/my'),
  getById:          (id)       => client.get(`/returns/${id}`),
  updateRefundMethod:(id, data) => client.patch(`/returns/${id}/refund-method`, data),

  // Seller
  getSellerReturns: (params)   => client.get('/returns/seller', { params }),
  sellerAction:     (id, data) => client.patch(`/returns/${id}/seller-action`, data),
  sellerAdvance:    (id, data) => client.patch(`/returns/${id}/seller-advance`, data),

  // Admin
  getAll:   (params)   => client.get('/returns', { params }),
  process:  (id, data) => client.patch(`/returns/${id}/process`, data),
};
