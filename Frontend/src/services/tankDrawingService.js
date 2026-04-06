// src/services/tankDrawingService.js
import api from './api';

const BASE_URL = '/tank-drawings';

// GET /api/tank-drawings/ (All drawings)
export const getAllDrawings = async () => {
  const response = await api.get(`${BASE_URL}/`);
  return response.data;
};

// GET /api/tank-drawings/tank/{tank_id}
export const getTankDrawings = async (tankId) => {
  const response = await api.get(`${BASE_URL}/tank/${tankId}`);
  return response.data;
};

// POST /api/tank-drawings/
export const uploadDrawing = async (formData) => {
  const response = await api.post(`${BASE_URL}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// PUT /api/tank-drawings/{drawingId}
export const updateDrawing = async (drawingId, formData) => {
  const response = await api.put(`${BASE_URL}/${drawingId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// DELETE /api/tank-drawings/{id}
export const deleteDrawing = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};
