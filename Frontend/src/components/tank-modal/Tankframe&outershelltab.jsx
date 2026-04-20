import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Upload, X } from 'lucide-react';
import { getAllTankFrameOuters } from '../../services/tankframeoutershellService';

// Unwrap UniformResponseMiddleware envelope: {success, data, message} → data
const unwrap = (response) => {
    if (response && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
        return response.data;
    }
    return response;
};

export default function TankframeAndOuterShellTab({ tankId, onNext, onClose }) {
    const safeTankId = (typeof tankId === 'object' && tankId !== null) ? tankId.id : tankId;

    const [allGA, setAllGA] = useState([]);
    const [selectedGaId, setSelectedGaId] = useState('');
    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (safeTankId) loadData();
    }, [safeTankId]);

    const loadData = async () => {
        if (!safeTankId) return;
        try {
            setLoading(true);
            // 1. Fetch from Master
            const resData = await getAllTankFrameOuters();
            const list = Array.isArray(unwrap(resData)) ? unwrap(resData) : [];
            const activeList = list.filter(item => item.status === 1);
            setAllGA(activeList);

            // 2. Fetch tank to get current ga_id
            const tankRes = await api.get(`/tanks/${safeTankId}`);
            const tankData = tankRes.data;
            if (tankData.ga_id) {
                setSelectedGaId(tankData.ga_id);
                const match = activeList.find(d => d.id === tankData.ga_id);
                if (match) setData(match);
            }
        } catch (err) {
            console.error("Failed to load valve/shell dropdown data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectionChange = async (e) => {
        const newId = e.target.value;
        setSelectedGaId(newId);

        if (newId) {
            const match = allGA.find(d => String(d.id) === String(newId));
            setData(match || null);
        } else {
            setData(null);
        }

        // Auto-save the selected ID to tank details
        try {
            setSaving(true);
            await api.put(`/tanks/${safeTankId}`, { ga_id: newId ? Number(newId) : null });
        } catch (err) {
            console.error("Failed to update ga_id on tank", err);
            alert("Failed to save selected GA reference. " + (err.response?.data?.message || ""));
        } finally {
            setSaving(false);
        }
    };

    if (!safeTankId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-lg font-medium text-gray-700">Please save the "Tank Basic Details" first.</p>
            </div>
        );
    }

    if (loading) return (
        <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
    );

    const slots = [
        { label: "GA Drawing", url: data?.ga_image_url },
        { label: "Image 2", url: data?.image2_image_url },
        { label: "Image 3", url: data?.img3_url },
        { label: "Image 4", url: data?.img4_url },
        { label: "Image 5", url: data?.img5_url },
        { label: "Image 6", url: data?.img6_url },
    ];

    return (
        <div className="flex flex-col h-full bg-white rounded shadow-sm p-4 overflow-y-auto w-full">
            <div className="mb-6 flex flex-col gap-2 max-w-sm">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    Tank Frame Reference
                    {saving && <span className="text-[10px] text-blue-500 animate-pulse">(Saving...)</span>}
                </label>
                <select
                    value={selectedGaId}
                    onChange={handleSelectionChange}
                    className="h-10 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] bg-white outline-none w-full"
                >
                    <option value="">-- Select Tank Frame Reference --</option>
                    {allGA.map(d => (
                        <option key={d.id} value={d.id}>{d.ga_reference}</option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400 italic">Select one from the Tank Frame & Outer Shell Master</p>
            </div>

            {!data ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-gray-100 rounded-xl flex-1">
                    <p className="text-lg font-bold text-gray-700">No Tank Frame Reference Selected</p>
                    <p className="text-sm text-gray-400 mt-2 italic">Please select a reference from the dropdown above.</p>
                </div>
            ) : (
                <div className="flex flex-col flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slots.map((slot, i) => (
                            <div key={i} className="flex flex-col border border-gray-100 rounded-lg p-3 bg-gray-50/30">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{slot.label}</h3>
                                <div className="flex-grow flex items-center justify-center min-h-[160px]">
                                    {slot.url ? (
                                        <img
                                            src={slot.url}
                                            alt={slot.label}
                                            className="max-w-full max-h-40 object-contain rounded shadow-sm cursor-zoom-in hover:scale-105 transition-transform"
                                            onClick={() => window.open(slot.url, '_blank')}
                                        />
                                    ) : (
                                        <div className="text-center text-gray-300">
                                            <Upload className="mx-auto h-8 w-8 mb-1 opacity-20" />
                                            <span className="text-[10px] italic">Not uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {data?.remarks && (
                        <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Remarks</h3>
                            <p className="text-gray-700 font-medium">{data.remarks}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end items-center mt-6 pt-4 border-t w-full">
                <div className="flex gap-3">
                    {onClose && (
                        <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium shadow-sm transition-colors text-sm">
                            Close
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="px-8 py-2 text-white bg-[#546E7A] rounded-md hover:bg-[#455A64] font-medium shadow-sm flex items-center transition-colors text-sm">
                            Save
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
