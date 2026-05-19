import client from './client';

export const returnsApi = {
  submit: (data) => client.post('/returns', data),
  getMy: () => client.get('/returns/my'),
};
