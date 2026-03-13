import client from './client';

export const getAssets = (params) =>
  client.get('/assets/', { params });

export const createAsset = (data) =>
  client.post('/assets/', data);

export const updateAsset = (id, data) =>
  client.put(`/assets/${id}/`, data);

export const deleteAsset = (id) =>
  client.delete(`/assets/${id}/`);

export const getAssetSummary = () =>
  client.get('/assets/summary/');

export const getAssetCategories = () =>
  client.get('/asset-categories/');
