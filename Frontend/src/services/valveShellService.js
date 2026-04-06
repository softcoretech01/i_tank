import api from './api';

const URL = '/tank-valve-and-shell';

export const getAllValveShell = async () => {
    try {
        const response = await api.get(URL + '/');
        return response.data;
    } catch (error) {
        console.error('Error fetching valve/shell data:', error);
        throw error;
    }
};

export const getValveShellById = async (id) => {
    try {
        const response = await api.get(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching valve/shell by id:', error);
        throw error;
    }
};

export const getValveShellByTank = async (tankId) => {
    try {
        const response = await api.get(`${URL}/tank/${tankId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching valve/shell by tank:', error);
        throw error;
    }
};

export const createValveShell = async (formData) => {
    try {
        const response = await api.post(URL + '/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating valve/shell:', error);
        throw error;
    }
};

export const updateValveShell = async (id, formData) => {
    try {
        const response = await api.put(`${URL}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating valve/shell:', error);
        throw error;
    }
};

export const deleteValveShell = async (id) => {
    try {
        const response = await api.delete(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting valve/shell:', error);
        throw error;
    }
};
