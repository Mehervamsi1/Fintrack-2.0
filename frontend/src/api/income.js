import client from './client';

export const getIncome = (params) =>
  client.get('/income/', { params });

export const createIncome = (data) =>
  client.post('/income/', data);

export const updateIncome = (id, data) =>
  client.put(`/income/${id}/`, data);

export const deleteIncome = (id) =>
  client.delete(`/income/${id}/`);

export const getIncomeSummary = () =>
  client.get('/income/summary/');

export const getSources = () =>
  client.get('/income-sources/');
