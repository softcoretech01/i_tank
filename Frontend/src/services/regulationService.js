import api from './api'; // Import your configured API instance

// API Routes (Relative to Base URL defined in api.js)
const MASTER_URL = '/regulations-master/';
const LINK_URL = '/tank-regulations/';

// --- MASTER LIST FUNCTIONS ---

export const getMasterRegulations = async () => {
  try {
    const response = await api.get(MASTER_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching master regulations:', error);
    throw error;
  }
};

export const createMasterRegulation = async (name) => {
  try {
    const response = await api.post(MASTER_URL, { regulation_name: name });
    return response.data;
  } catch (error) {
    console.error('Error creating regulation:', error);
    throw error;
  }
};

export const updateMasterRegulation = async (id, name) => {
  try {
    const response = await api.put(`${MASTER_URL}${id}`, { regulation_name: name });
    return response.data;
  } catch (error) {
    console.error('Error updating regulation:', error);
    throw error;
  }
};

export const deleteMasterRegulation = async (id) => {
  try {
    const response = await api.delete(`${MASTER_URL}${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting regulation:', error);
    throw error;
  }
};

// --- TANK LINK FUNCTIONS ---

export const getTankRegulations = async (tankId) => {
  try {
    // This resolves to: http://127.0.0.1:8000/api/tank-regulations/tank/{id}
    const response = await api.get(`${LINK_URL}tank/${tankId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching regulations for tank ${tankId}:`, error);
    throw error;
  }
};

export const addTankRegulation = async (payload) => {
  try {
    const response = await api.post(LINK_URL, payload);
    return response.data;
  } catch (error) {
    console.error('Error adding tank regulation:', error);
    throw error;
  }
};

export const updateTankRegulation = async (regId, payload) => {
  try {
    const response = await api.put(`${LINK_URL}${regId}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating tank regulation ${regId}:`, error);
    throw error;
  }
};

export const deleteTankRegulation = async (regId) => {
  try {
    const response = await api.delete(`${LINK_URL}${regId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting regulation ${regId}:`, error);
    throw error;
  }
};