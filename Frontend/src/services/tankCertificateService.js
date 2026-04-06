// src/services/tankCertificateService.js
import api from './api';

const BASE_URL = '/tank-certificates';

// GET /api/tank-certificates/
export const getAllCertificates = async () => {
  const response = await api.get(`${BASE_URL}/`);
  return response.data;
};

// GET /api/tank-certificates/tank/{tank_id}
export const getTankCertificates = async (tankId) => {
  const response = await api.get(`${BASE_URL}/tank/${tankId}`);
  return response.data;
};

// POST /api/tank-certificates/
export const createCertificate = async (formData) => {
  const response = await api.post(`${BASE_URL}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// PUT /api/tank-certificates/{cert_id}
export const updateCertificate = async (certId, formData) => {
  const response = await api.put(`${BASE_URL}/${certId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// DELETE /api/tank-certificates/{cert_id}
export const deleteCertificate = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

// POST /api/tank-certificates/upload-certificate-image
export const uploadCertificateImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`${BASE_URL}/upload-certificate-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
