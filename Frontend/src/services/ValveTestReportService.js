// src/services/ValveTestReportService.js
import api from './api';

const BASE_URL = '/valve-test-reports';

// GET /api/valve-test-reports/tank/{tank_id}
export const getValveTestReport = async (tankId) => {
  const response = await api.get(`${BASE_URL}/tank/${tankId}`);
  return response.data;
};

// POST /api/valve-test-reports/
export const saveValveTestReport = async (formData) => {
  const response = await api.post(`${BASE_URL}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// DELETE /api/valve-test-reports/{id}
export const deleteValveTestReport = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};
