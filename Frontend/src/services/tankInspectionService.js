// src/services/tankInspectionService.js

import api from './api'; // use the shared axios instance

const BASE_URL = '/tank-inspection';

/**
 * Gets all inspection records for the given tank ID.
 * If the backend has a filter endpoint (e.g. GET /tank-inspection?tank_id=ID),
 * this will call it. Otherwise it will fetch all and filter on the frontend.
 */
export const getTankInspections = async (tankId) => {
  try {
    // Try calling with query param if your backend supports it:
    const response = await api.get(`${BASE_URL}/`, {
      params: { tank_id: tankId },
    });

    // If backend just returns all inspections, and doesn't filter by tank_id,
    // you can still safely filter here:
    const data = Array.isArray(response.data) ? response.data : response.data.data || response.data;
    return data.filter((record) => record.tank_id === tankId);
  } catch (error) {
    console.error(
      `Error fetching inspections for tank ${tankId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Creates a new inspection record.
 * POST /tank-inspection/
 */
export const createInspection = async (payload) => {
  try {
    const response = await api.post(`${BASE_URL}/`, payload);
    return response.data;
  } catch (error) {
    console.error('Error creating inspection:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates an existing inspection record.
 * PUT /tank-inspection/{id}
 */
export const updateInspection = async (id, payload) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating inspection ${id}:`, error.response?.data || error.message);
    throw error;
  }
};
