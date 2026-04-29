import api from './api';

// Endpoint for master data
const URL = '/master/all';

export const getAllMasterData = async () => {
    try {
        const response = await api.get(URL);
        const data = response.data?.data || response.data || {};

        // Normalize keys and filter by status
        const activeOnly = (arr) => Array.isArray(arr) ? arr.filter(item => item.status !== 0) : [];

        return {
            manufacturer: activeOnly(data.manufacturer),
            standard: activeOnly(data.standard),
            tankcode_iso: activeOnly(data.tankcode_iso),
            un_iso_code: activeOnly(data.un_iso_code || data.un__code),
            design_temperature: activeOnly(data.design_temperature),
            cabinet: activeOnly(data.cabinet),
            frame_type: activeOnly(data.frame_type),
            pump: activeOnly(data.pump),
            mawp: activeOnly(data.mawp),
            ownership: activeOnly(data.ownership),
            size: activeOnly(data.size),
            inspection_agency: activeOnly(data.inspection_agency),
            products: activeOnly(data.products),
            safety_valve_brands: activeOnly(data.safety_valve_brands),
            master_valves: activeOnly(data.master_valves),
            master_gauges: activeOnly(data.master_gauges),
            pv_code: data.pv_code || [],
            evacuation_valve_type: activeOnly(data.evacuation_valve_type),
            color_body_frame: activeOnly(data.color_body_frame),
        };
    } catch (error) {
        console.error('Error fetching master data:', error);
        return {
            manufacturer: [], standard: [], tankcode_iso: [], un_iso_code: [],
            design_temperature: [], cabinet: [], frame_type: [], pump: [],
            mawp: [], ownership: [], size: [], inspection_agency: [],
            products: [], safety_valve_brands: [],
            master_valves: [], master_gauges: [], pv_code: [],
            evacuation_valve_type: [], color_body_frame: []
        };
    }
};