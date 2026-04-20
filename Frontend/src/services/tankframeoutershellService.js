import api from './api';

const URL = '/tank-frame-outer';

export const getAllTankFrameOuters = async () => {
    try {
        const response = await api.get(URL + '/');
        return response.data;
    } catch (error) {
        console.error('Error fetching tank frame outer data:', error);
        throw error;
    }
};

export const getTankFrameOuterById = async (id) => {
    try {
        const response = await api.get(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tank frame outer by id:', error);
        throw error;
    }
};

export const getTankFrameOuterByTank = async (tankId) => {
    try {
        const response = await api.get(`${URL}/tank/${tankId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tank frame outer by tank:', error);
        throw error;
    }
};

export const createTankFrameOuter = async (formData) => {
    try {
        const response = await api.post(URL + '/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating tank frame outer:', error);
        throw error;
    }
};

export const updateTankFrameOuter = async (id, formData) => {
    try {
        const response = await api.put(`${URL}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating tank frame outer:', error);
        throw error;
    }
};

export const deleteTankFrameOuter = async (id) => {
    try {
        const response = await api.delete(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting tank frame outer:', error);
        throw error;
    }
};
