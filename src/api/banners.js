import client from './client';

export const bannersApi = {
  getActive: () => client.get('/banners/active'),
};
