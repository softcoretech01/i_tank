import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getAllMasterData } from '../../services/masterService';

const BUTTON_STATES = {
    1: { color: 'bg-green-500', label: 'OK' },
    2: { color: 'bg-red-500', label: 'FAULTY' },
    3: { color: 'bg-white border border-gray-300', label: 'NA' },
};

export default function TankValveTab({ tankId, onNext, onClose }) {
    const [loading, setLoading] = useState(false);
    const [valves, setValves] = useState([]);
    const [hasExistingData, setHasExistingData] = useState(false);

    useEffect(() => {
        if (tankId) {
            loadValves();
        }
    }, [tankId]);

    const loadValves = async () => {
        try {
            setLoading(true);

            // 1. Fetch master valves list via service
            const masterData = await getAllMasterData();
            const valveMasterList = masterData.master_valves || [];
            const valveNames = valveMasterList.map(v => v.name);

            // 2. Fetch existing tank valves
            const res = await api.get(`/tank-valves/tank/${tankId}`);
            const responseData = res.data?.data || res.data;
            const dataArray = (responseData && Array.isArray(responseData.valves))
                ? responseData.valves
                : (Array.isArray(responseData) ? responseData : []);

            console.log("Loaded valves for tank:", tankId, dataArray);

            // 3. Source of Truth: Use existing data if available, else master
            let initialized = [];
            if (dataArray.length > 0) {
                setHasExistingData(true);
                initialized = dataArray.map(v => ({
                    id: v.id,
                    feature: v.feature,
                    status_id: v.status_id
                }));
            } else {
                setHasExistingData(false);
                initialized = valveNames.map(f => ({
                    id: null,
                    feature: f,
                    status_id: 1
                }));
            }
            setValves(initialized);
        } catch (err) {
            console.error("Failed to load valves", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (index) => {
        setValves(prev => {
            const copy = [...prev];
            const currentId = copy[index].status_id;
            let nextId = 1;
            if (currentId === 1) nextId = 2;
            else if (currentId === 2) nextId = 3;
            else if (currentId === 3) nextId = 1;
            else nextId = 1;

            copy[index].status_id = nextId;
            return copy;
        });
    };

    const handleFeatureNameChange = (index, newName) => {
        setValves(prev => {
            const copy = [...prev];
            copy[index].feature = newName;
            return copy;
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            const payloadValves = valves.map(v => ({
                id: v.id,
                feature: v.feature,
                status_id: v.status_id
            }));

            const payload = {
                tank_id: tankId,
                valves: payloadValves
            };

            if (hasExistingData) {
                await api.post('/tank-valves/update', payload);
            } else {
                await api.post('/tank-valves/create', payload);
                setHasExistingData(true);
            }

            if (onNext) onNext();
        } catch (err) {
            console.error(err);
            alert("Failed to save valves.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded shadow-sm">
            <div className="flex-grow overflow-y-auto p-2">
                <div className="flex justify-end gap-6 mb-4 px-4 max-w-6xl mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm" />
                        <span className="text-sm font-medium text-gray-700">Satisfactory</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm" />
                        <span className="text-sm font-medium text-gray-700">Faulty</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-white border border-gray-300 shadow-sm" />
                        <span className="text-sm font-medium text-gray-700">NA</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {[0, 1, 2].map(colIndex => (
                        <div key={colIndex} className="flex flex-col border border-gray-200 rounded-sm">
                            {valves.filter((_, i) => i % 3 === colIndex).map((v, i) => {
                                const realIndex = i * 3 + colIndex;
                                const state = BUTTON_STATES[v.status_id] || BUTTON_STATES[1];
                                return (
                                    <div key={realIndex} className="flex items-center justify-between py-1.5 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                        <input
                                            type="text"
                                            value={v.feature}
                                            onChange={(e) => handleFeatureNameChange(realIndex, e.target.value)}
                                            className="text-sm text-gray-700 font-medium truncate mr-2 bg-transparent border-none focus:ring-0 focus:outline-none w-full"
                                            title={v.feature}
                                        />
                                        <button
                                            type="button"
                                            className={`w-5 h-5 rounded-full ${state.color} hover:opacity-80 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 flex-shrink-0`}
                                            onClick={() => handleToggle(realIndex)}
                                            title={state.label}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-3 px-3 py-3 border-t bg-gray-50">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium shadow-sm"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 text-white bg-[#546E7A] rounded-md hover:bg-[#455A64] font-medium shadow-sm flex items-center"
                >
                    {loading ? 'Saving...' : 'Save & Next'}
                </button>
            </div>
        </div>
    );
}
