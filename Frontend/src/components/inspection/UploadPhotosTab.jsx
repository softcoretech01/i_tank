import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { uploadInspectionImages, getInspectionImages, updateInspectionImages, toggleImageMark } from '../../services/inspectionService';
import { getUploadUrl } from '../../services/api';

const IMAGE_TYPE_MAP = {
    "front_view": "Front View",
    "rear_view": "Rear View",
    "top_view": "Top View",
    "undersideview01": "Underside View 01",
    "undersideview02": "Underside View 02",
    "front_lh_view": "Front LH View",
    "rear_lh_view": "Rear LH View",
    "front_rh_view": "Front RH View",
    "rear_rh_view": "Rear RH View",
    "lh_side_view": "LH Side View",
    "rh_side_view": "RH Side View",
    "valves_section_view": "Valves Section",
    "safety_valve": "Safety Valve",
    "level___pressure_gauge": "Level/Pressure Gauge",
    "vacuum_reading": "Vacuum Reading",
};

// Mapping from frontend keys to backend parameter names
const IMAGE_KEY_MAPPING = {
    "front_view": "frontview",
    "rear_view": "rearview",
    "top_view": "topview",
    "undersideview01": "undersideview01",
    "undersideview02": "undersideview02",
    "front_lh_view": "frontlhview",
    "rear_lh_view": "rearlhview",
    "front_rh_view": "frontrhview",
    "rear_rh_view": "rearrhview",
    "lh_side_view": "lhsideview",
    "rh_side_view": "rhsideview",
    "valves_section_view": "valvessectionview",
    "safety_valve": "safetyvalve",
    "level___pressure_gauge": "levelpressuregauge",
    "vacuum_reading": "vacuumreading",
};

// Reverse mapping from backend image_type to frontend key
const REVERSE_IMAGE_KEY_MAPPING = Object.fromEntries(
    Object.entries(IMAGE_KEY_MAPPING).map(([key, value]) => [value, key])
);

export default function UploadPhotosTab({ inspectionId, onNext, mode }) {
    const [files, setFiles] = useState({});
    const [previews, setPreviews] = useState({});
    const [isUploading, setIsUploading] = useState(false);

    const fetchExistingImages = async () => {
        if (inspectionId) {
            try {
                const res = await getInspectionImages(inspectionId);
                if (res.success && res.data && res.data.images) {
                    const existingPreviews = {};
                    res.data.images.forEach(img => {
                        if (img.image_type) {
                            const frontendKey = REVERSE_IMAGE_KEY_MAPPING[img.image_type] || img.image_type;
                            existingPreviews[frontendKey] = {
                                url: img.image_url || getUploadUrl(img.image_path),
                                id: img.id,
                                isMarked: img.is_marked === 1
                            };
                        }
                    });
                    setPreviews(existingPreviews);
                }
            } catch (err) {
                console.error("Error fetching existing images:", err);
            }
        }
    };

    useEffect(() => {
        fetchExistingImages();
    }, [inspectionId]);

    const handleFileChange = (key, e) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [key]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ 
                    ...prev, 
                    [key]: { url: reader.result, id: null, isMarked: false } 
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleToggleMark = async (key, imageId, currentMarked, e) => {
        e.preventDefault();
        e.stopPropagation();

        const newMarked = currentMarked ? 0 : 1;
        
        // If image exists in DB, update immediately
        if (imageId) {
            try {
                await toggleImageMark(imageId, newMarked);
            } catch (err) {
                console.error("Failed to toggle mark:", err);
                alert("Failed to update mark status on server.");
                return;
            }
        }

        // Always update local state
        setPreviews(prev => ({
            ...prev,
            [key]: { ...prev[key], isMarked: newMarked === 1 }
        }));
    };

    const handleUpload = async () => {
        if (!inspectionId) {
            alert("Please save Tank Info first.");
            return;
        }

        if (Object.keys(files).length === 0) {
            onNext();
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            const markedTypesArray = [];

            Object.keys(files).forEach(key => {
                const backendKey = IMAGE_KEY_MAPPING[key] || key;
                formData.append(backendKey, files[key]);
                
                // Track if this file should be marked
                if (previews[key]?.isMarked) {
                    markedTypesArray.push(backendKey);
                }
            });

            const markedTypesStr = markedTypesArray.join(',');

            // Use update to replace/save correctly
            await updateInspectionImages(inspectionId, formData, markedTypesStr);
            alert("Photos updated successfully!");

            await fetchExistingImages();
            setFiles({});
            onNext();
        } catch (err) {
            console.error(err);
            alert("Failed to upload photos.");
        } finally {
            setIsUploading(false);
        }
    };

    const navigate = useNavigate();

    const handleCancel = () => {
        navigate('/inspection');
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(IMAGE_TYPE_MAP).map(([key, label]) => (
                    <div key={key} className="flex flex-col items-center group relative">
                        <label className={`
                            relative w-full aspect-square rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer bg-gray-50
                            ${previews[key] ? 'border-[#48BB78] bg-green-50' : 'border-gray-300 hover:border-[#546E7A]'}
                            flex flex-col items-center justify-center p-4 text-center overflow-hidden
                        `}>
                            {previews[key] ? (
                                <>
                                    <img src={previews[key].url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="text-white w-8 h-8" />
                                    </div>
                                    <div className="absolute top-2 right-2 bg-[#48BB78] text-white rounded-full p-1 shadow-md">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#546E7A]" />
                                    <span className="text-base font-semibold text-gray-500 uppercase tracking-wider group-hover:text-[#546E7A]">{label}</span>
                                </>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(key, e)}
                            />
                        </label>

                        {/* Round Toggle Button - White by default, Red if clicked */}
                        {previews[key] && (
                            <button
                                type="button"
                                onClick={(e) => handleToggleMark(key, previews[key].id || null, previews[key].isMarked, e)}
                                className={`
                                    absolute bottom-10 right-4 z-[9999] w-9 h-9 rounded-full border-4 shadow-2xl flex items-center justify-center transition-all duration-300
                                    ${previews[key].isMarked 
                                        ? 'bg-red-600 border-red-100 scale-125' 
                                        : 'bg-white border-gray-100 scale-100 hover:scale-110 hover:border-red-400'
                                    }
                                `}
                            >
                                <div className={`w-3.5 h-3.5 rounded-full ${previews[key].isMarked ? 'bg-white' : 'bg-transparent'}`} />
                            </button>
                        )}

                        <span className="mt-2 text-sm font-bold text-gray-400 uppercase tracking-widest truncate w-full text-center">
                            {key}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button
                    onClick={handleCancel}
                    variant="secondary"
                    icon={RotateCcw}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-3 rounded-xl shadow-sm text-base font-bold uppercase"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="primary"
                    isLoading={isUploading}
                    className="bg-[#546E7A] hover:bg-[#455A64] text-white px-10 py-3 rounded-xl shadow-lg shadow-slate-200 text-base font-bold uppercase"
                >
                    {mode === 'ADD' ? (Object.keys(files).length > 0 ? 'Upload & Next' : 'Next') : 'Update'}
                </Button>
            </div>
        </div>
    );
}
