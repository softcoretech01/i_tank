// src/services/tankService.js
import api from './api'; // Import the configured instance

const BASE_URL = '/tanks';

/*
 * Fetches all tanks.
 */
export const getTanks = async () => {
  try {
    // Calling api.get('/tanks/') will automatically resolve to:
    // Local: http://127.0.0.1:8000/iti-web/api/tanks/
    // UAT:   https://uat.spairyx.com/iti-web/api/tanks/
    const response = await api.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tanks:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches a single tank by its primary ID.
 */
export const getTankById = async (tankId) => {
  try {
    const response = await api.get(`${BASE_URL}/${tankId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tank ${tankId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Creates a new tank.
 */
export const createTank = async (tankData) => {
  try {
    // Ensure boolean/numeric conversions if needed before sending
    const dataToSend = {
      ...tankData,
      lease: tankData.lease ? 1 : 0
    };
    const response = await api.post(`${BASE_URL}/`, dataToSend);
    return response.data;
  } catch (error) {
    console.error('Error creating tank:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates an existing tank.
 */
export const updateTank = async (tankId, tankData) => {
  try {
    const dataToSend = {
      ...tankData,
      lease: tankData.lease ? 1 : 0
    };
    const response = await api.put(`${BASE_URL}/${tankId}`, dataToSend);
    return response.data;
  } catch (error) {
    console.error(`Error updating tank ${tankId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Deletes a tank.
 */
export const deleteTank = async (tankId) => {
  try {
    const response = await api.delete(`${BASE_URL}/${tankId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting tank ${tankId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const uploadTankImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`${BASE_URL}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading tank image:', error.response?.data || error.message);
    throw error;
  }
};