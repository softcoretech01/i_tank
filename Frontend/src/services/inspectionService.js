// src/services/inspectionService.js
import api from './api';

const BASE_URL = '/tank_inspection_checklist';
const UPLOAD_URL = '/upload';
const CHECKPOINTS_URL = '/tank_checkpoints';
const TODO_URL = '/to_do_list';

export const getInspectionMasters = async () => {
    const response = await api.get(`${BASE_URL}/masters`);
    return response.data;
};

export const getActiveTanks = async () => {
    const response = await api.get(`${BASE_URL}/active-tanks`);
    return response.data;
};

export const createInspection = async (payload) => {
    const response = await api.post(`${BASE_URL}/create/tank_inspection`, payload);
    return response.data;
};

export const updateInspection = async (inspectionId, payload) => {
    const response = await api.put(`${BASE_URL}/update/tank_inspection_details/${inspectionId}`, payload);
    return response.data;
};

export const getChecklistTemplate = async () => {
    const response = await api.get(`${CHECKPOINTS_URL}/export/checklist`);
    return response.data;
};

export const saveChecklist = async (payload) => {
    // payload: { inspection_id, tank_id, emp_id, sections: [...] }
    const response = await api.put(`${CHECKPOINTS_URL}/update/checklist`, payload);
    return response.data;
};

export const createChecklist = async (payload) => {
    // payload: { inspection_id, tank_id, sections: [...] }
    const response = await api.post(`${CHECKPOINTS_URL}/create/inspection_checklist_bulk`, payload);
    return response.data;
};

export const getInspectionImages = async (inspectionId) => {
    const response = await api.get(`${UPLOAD_URL}/images/inspection/${inspectionId}`);
    return response.data;
};

export const uploadInspectionImages = async (inspectionId, formData, markedTypes = '') => {
    const url = markedTypes ? `${UPLOAD_URL}/batch/${inspectionId}?marked_types=${markedTypes}` : `${UPLOAD_URL}/batch/${inspectionId}`;
    const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadLifterWeight = async (inspectionId, formData) => {
    const response = await api.post(`${BASE_URL}/${inspectionId}/lifter_weight`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateInspectionImages = async (inspectionId, formData, markedTypes = '') => {
    const url = markedTypes ? `${UPLOAD_URL}/images/inspection/${inspectionId}?marked_types=${markedTypes}` : `${UPLOAD_URL}/images/inspection/${inspectionId}`;
    const response = await api.put(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const toggleImageMark = async (imagePk, isMarked) => {
    const response = await api.put(`${UPLOAD_URL}/mark/${imagePk}?is_marked=${isMarked}`);
    return response.data;
};

export const getMarkedImages = async (inspectionId) => {
    const response = await api.get(`${UPLOAD_URL}/marked/${inspectionId}`);
    return response.data;
};

export const getFlaggedItems = async (inspectionId) => {
    const response = await api.get(`${TODO_URL}/flagged/inspection/${inspectionId}/grouped`);
    return response.data;
};

export const updateToDoItems = async (payload) => {
    const response = await api.put(`${TODO_URL}/update`, payload);
    return response.data;
};

export const submitInspection = async (inspectionId) => {
    const response = await api.get(`${BASE_URL}/submit`, {
        headers: { 'inspection-id': inspectionId }
    });
    return response.data;
};

export const getInspectionReview = async (inspectionId) => {
    const response = await api.get(`${BASE_URL}/review/${inspectionId}`);
    return response.data;
};

export const getAllInspections = async () => {
    const response = await api.get(`${BASE_URL}/list/all`);
    return response.data;
};

export const finalizeReview = async (inspectionId) => {
    const response = await api.post(`${BASE_URL}/review_finalize/${inspectionId}`);
    return response.data;
};

export const getInspectionHistory = async () => {
    const response = await api.get(`${BASE_URL}/history`);
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get(`${BASE_URL}/user/me`);
    return response.data;
};

export const getTankDetails = async (tankId) => {
    const response = await api.get(`${BASE_URL}/tank-details/${tankId}`);
    return response.data;
};

export const exportInspectionsToExcel = async () => {
    const response = await api.get(`${BASE_URL}/export-to-excel`, {
        responseType: 'blob'
    });
    return response;
};
