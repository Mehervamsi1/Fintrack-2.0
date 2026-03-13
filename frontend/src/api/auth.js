import client from './client';

export const login = (username, password) =>
  client.post('/auth/login/', { username, password });

export const register = (data) =>
  client.post('/auth/register/', data);

export const refreshToken = (refresh) =>
  client.post('/auth/token/refresh/', { refresh });

export const getUser = () =>
  client.get('/auth/user/');

export const updateUser = (data) =>
  client.put('/auth/user/', data);
