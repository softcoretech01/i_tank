import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormSelect } from '../ui/FormSelect';
import { FormInput } from '../ui/FormInput';
import { Button } from '../ui/Button';
import { Save, Info, RotateCcw, LayoutList } from 'lucide-react';
import { createInspection, updateInspection, getInspectionReview, getTankDetails } from '../../services/inspectionService';

export default function TankInfoTab({ masters, activeTanks, onSuccess, inspectionId, mode }) {
    const [formData, setFormData] = useState({
        tank_id: '',
        status_id: '',
        inspection_type_id: '',
        location_id: '',
        vacuum_reading: '',
        vacuum_uom: 'Micron',
        lifter_weight_value: '',
    });

    const [initialFormData, setInitialFormData] = useState(null);
    const [selectedTankNumber, setSelectedTankNumber] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [tankDetails, setTankDetails] = useState(null);

    const fetchDetails = async (tId) => {
        try {
            const res = await getTankDetails(tId);
            if (res.success) {
                setTankDetails(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch tank details", err);
        }
    };

    const loadExistingData = async () => {
        if (inspectionId) {
            try {
                const res = await getInspectionReview(inspectionId);
                if (res.success && res.data.inspection) {
                    const insp = res.data.inspection;
                    const loadedData = {
                        tank_id: insp.tank_id || '',
                        status_id: insp.status_id || '',
                        inspection_type_id: insp.inspection_type_id || '',
                        location_id: insp.location_id || '',
                        vacuum_reading: insp.vacuum_reading || '',
                        vacuum_uom: insp.vacuum_uom || 'Micron',
                        lifter_weight_value: insp.lifter_weight_value || '',
                    };
                    setFormData(loadedData);
                    setInitialFormData(JSON.parse(JSON.stringify(loadedData)));
                    setSelectedTankNumber(insp.tank_number || '');

                    if (insp.tank_id) fetchDetails(insp.tank_id);
                }
            } catch (err) {
                console.error("Error loading inspection details for edit:", err);
            }
        }
    };

    useEffect(() => {
        loadExistingData();
    }, [inspectionId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'tank_id') {
            const tank = activeTanks.find(t => String(t.tank_id) === String(value));
            setSelectedTankNumber(tank ? tank.tank_number : '');
            if (value) {
                fetchDetails(value);
            } else {
                setTankDetails(null);
            }
        }
    };

    // Navigation for Cancel
    const navigate = useNavigate();

    const handleCancel = () => {
        navigate('/inspection');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                tank_id: formData.tank_id ? parseInt(formData.tank_id) : null,
                status_id: formData.status_id ? parseInt(formData.status_id) : null,
                inspection_type_id: formData.inspection_type_id ? parseInt(formData.inspection_type_id) : null,
                location_id: formData.location_id ? parseInt(formData.location_id) : null,
            };

            let res;
            if (inspectionId) {
                res = await updateInspection(inspectionId, payload);
            } else {
                res = await createInspection(payload);
            }

            if (res.success) {
                const newId = inspectionId || res.data.inspection_id;
                alert(inspectionId ? "Inspection updated successfully!" : "Inspection created successfully!");
                setInitialFormData(JSON.parse(JSON.stringify(formData)));
                onSuccess(newId, formData.tank_id);
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Failed to save inspection info. Please check your inputs.";
            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="w-full animate-in fade-in duration-500 pb-10 uppercase text-[#546E7A]">
            <div className="flex flex-col lg:flex-row gap-4 items-start">

                {/* LEFT: Inspection Form Fields */}
                <div className="flex-[3] bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-1">
                        <h3 className="font-black uppercase tracking-widest text-[22px] text-[#37474F]">Inspection Basic Info</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        <div className="col-span-1">
                            {inspectionId ? (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm uppercase font-bold text-gray-400 tracking-wider">Tank Number</label>
                                    <div className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-lg font-black text-[#546E7A]">
                                        {selectedTankNumber || 'N/A'}
                                    </div>
                                </div>
                            ) : (
                                <FormSelect
                                    label="Select Tank"
                                    id="tank_id"
                                    name="tank_id"
                                    value={formData.tank_id}
                                    onChange={handleChange}
                                    required
                                    className="rounded-xl border-gray-200 text-base"
                                >
                                    <option value="">-- Select Tank --</option>
                                    {activeTanks.map(t => (
                                        <option key={t.tank_id} value={t.tank_id}>{t.tank_number}</option>
                                    ))}
                                </FormSelect>
                            )}
                        </div>

                        <FormSelect
                            label="Tank Status"
                            id="status_id"
                            name="status_id"
                            value={formData.status_id}
                            onChange={handleChange}
                            className="text-base"
                        >
                            <option value="">-- Select Status --</option>
                            {masters.tank_statuses?.map(s => (
                                <option key={s.status_id} value={s.status_id}>{s.status_name}</option>
                            ))}
                        </FormSelect>

                        <FormSelect
                            label="Inspection Type"
                            id="inspection_type_id"
                            name="inspection_type_id"
                            value={formData.inspection_type_id}
                            onChange={handleChange}
                            className="text-base"
                        >
                            <option value="">-- Select Type --</option>
                            {masters.inspection_types?.map(t => (
                                <option key={t.inspection_type_id} value={t.inspection_type_id}>{t.inspection_type_name}</option>
                            ))}
                        </FormSelect>


                        <FormSelect
                            label="Location"
                            id="location_id"
                            name="location_id"
                            value={formData.location_id}
                            onChange={handleChange}
                            className="text-base"
                        >
                            <option value="">-- Select Location --</option>
                            {masters.locations?.map(l => (
                                <option key={l.location_id} value={l.location_id}>{l.location_name}</option>
                            ))}
                        </FormSelect>

                        <FormInput
                            label="Vacuum Reading"
                            id="vacuum_reading"
                            name="vacuum_reading"
                            value={formData.vacuum_reading}
                            onChange={handleChange}
                            placeholder="Enter value"
                            className="text-base"
                        />

                        <FormSelect
                            label="Vacuum UOM"
                            id="vacuum_uom"
                            name="vacuum_uom"
                            value={formData.vacuum_uom}
                            onChange={handleChange}
                            className="text-base"
                        >
                            <option value="">-- Select UOM --</option>
                            <option value="Micron">Micron</option>
                            <option value="Torr">Torr</option>
                        </FormSelect>

                        <FormInput
                            label="Lifter Weight"
                            id="lifter_weight_value"
                            name="lifter_weight_value"
                            value={formData.lifter_weight_value}
                            onChange={handleChange}
                            placeholder="Enter weight"
                            className="text-base"
                        />

                        {/* ACTION BUTTONS */}
                        <div className="col-span-1 md:col-span-2 pt-4 flex items-center gap-4">
                            <Button
                                type="submit"
                                variant="primary"
                                icon={Save}
                                isLoading={isSaving}
                                className="bg-[#48BB78] hover:bg-[#38A169] text-white py-3 rounded-xl shadow-lg text-sm font-black uppercase tracking-wider transition-all w-48"
                            >
                                {mode === 'ADD' ? 'Save' : 'Update Report'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                icon={RotateCcw}
                                onClick={handleCancel}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all w-48"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Vertical Tank Specifications Panel - INCREASED WIDTH */}
                <div className="w-80 lg:sticky lg:top-4 pt-[0px]">
                    <div className="bg-[#546E7A] rounded-2xl p-4 text-white shadow-lg overflow-hidden relative min-h-[300px]">
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                <Info className="w-3 h-3 text-blue-200" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">Tank Specs</h4>
                                <p className="text-[10px] text-blue-100/60 uppercase font-black">Master Data</p>
                            </div>
                        </div>

                        {tankDetails ? (
                            <div className="space-y-3 relative z-10">
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">MFGR Name</label>
                                        <p className="text-sm font-bold tracking-tight">{tankDetails.mfgr || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Ownership</label>
                                        <p className="text-sm font-bold tracking-tight">{tankDetails.ownership || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-1">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-wider">Pressure</label>
                                        <span className="text-sm font-black text-blue-200">{tankDetails.working_pressure || '0'} Bar</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/10 pb-1">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-wider">Temp</label>
                                        <span className="text-sm font-black text-blue-200">{tankDetails.design_temperature || '0'} °C</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/10 pb-1">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-wider">Frame</label>
                                        <span className="text-xs font-bold text-white/90">{tankDetails.frame_type || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/10 pb-1">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-wider">Cabinet</label>
                                        <span className="text-xs font-bold text-white/90">{tankDetails.cabinet_type || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/10 pb-1">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-wider">S/V Brand</label>
                                        <span className="text-xs font-bold text-white/90">{tankDetails.safety_valve_brand_name || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 shadow-inner">
                                        <label className="text-[9px] font-black text-blue-200 uppercase tracking-[0.2em] block mb-1 text-center">Next Periodic Inspection Due</label>
                                        <p className="text-lg font-black text-center text-[#51cf66] drop-shadow-md">
                                            {tankDetails.pi_next_inspection_date ? new Date(tankDetails.pi_next_inspection_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT SET'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 h-full">
                                <LayoutList className="w-10 h-10 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Select a tank above to<br />load master technical data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
