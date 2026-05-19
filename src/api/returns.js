import client from './client';

export const returnsApi = {
  // Customer
  submit:           (data)     => client.post('/returns', data),
  getMy:            ()         => client.get('/returns/my'),
  getById:          (id)       => client.get(`/returns/${id}`),
  updateRefundMethod:(id, data) => client.patch(`/returns/${id}/refund-method`, data),

  // Employee
  getEmployeeReturns: (params)   => client.get('/returns/employee', { params }),
  employeeAction:     (id, data) => client.patch(`/returns/${id}/employee-action`, data),
  employeeAdvance:    (id, data) => client.patch(`/returns/${id}/employee-advance`, data),

  // Admin
  getAll:   (params)   => client.get('/returns', { params }),
  process:  (id, data) => client.patch(`/returns/${id}/process`, data),
};
