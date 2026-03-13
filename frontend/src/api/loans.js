import client from './client';

export const getLoans = (params) =>
  client.get('/loans/', { params });

export const createLoan = (data) =>
  client.post('/loans/', data);

export const updateLoan = (id, data) =>
  client.put(`/loans/${id}/`, data);

export const deleteLoan = (id) =>
  client.delete(`/loans/${id}/`);

export const getLoanSummary = () =>
  client.get('/loans/summary/');

export const getLoanPayments = (id) =>
  client.get(`/loans/${id}/payments/`);

export const addLoanPayment = (id, data) =>
  client.post(`/loans/${id}/payments/`, data);
