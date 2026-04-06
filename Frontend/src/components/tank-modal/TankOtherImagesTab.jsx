import React, { useState, useEffect } from 'react';
import api, { getUploadUrl } from '../../services/api';
import { Upload, X, Save } from 'lucide-react';

export default function TankOtherImagesTab({ tankId, onNext, onClose }) {
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState({}); // { "image_1": { text: "", file: null, preview: url, existing: bool } }

    useEffect(() => {
        if (tankId) {
            loadData();
        }
    }, [tankId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/other-images/tank/${tankId}`);
            const data = res.data?.data || res.data; // Wrapper check

            // Expected: { tank_id: ..., images: { "image_1": { image_url: ... } } }
            // Or wrapper: { success: true, data: { tank_id: ..., images: ... } }

            const records = data?.images || {};

            const initialState = {};
            for (let i = 1; i <= 9; i++) {
                const key = `image_${i}`;
                if (records[key]) {
                    const rec = records[key];
                    const url = getUploadUrl(rec.image_url);
                    initialState[key] = {
                        file: null,
                        preview: `${url}?t=${new Date().getTime()}`,
                        existing: true
                    };
                } else {
                    initialState[key] = {
                        file: null,
                        preview: null,
                        existing: false
                    };
                }
            }
            setImages(initialState);

        } catch (err) {
            console.error("Failed to load other images", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, key) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImages(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    file: file,
                    preview: url
                }
            }));
        }
    };

    const handleDelete = (key) => {
        // For now, only clearing local state. 
        // If we want to delete from DB, we need an API. 
        // User requirement only said Create/Update.
        setImages(prev => ({
            ...prev,
            [key]: {
                file: null,
                preview: null,
                existing: false
            }
        }));
    };

    const handleSave = async () => {
        // Collect all files
        const formData = new FormData();
        formData.append('tank_id', tankId);

        let hasFiles = false;
        Object.keys(images).forEach(key => {
            if (images[key].file) {
                formData.append(key, images[key].file);
                hasFiles = true;
            }
        });

        if (!hasFiles) {
            // If no new files, just proceed or alert?
            // Maybe user just wants to view.
            if (onNext) onNext();
            return;
        }

        try {
            setLoading(true);
            await api.post('/other-images/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (onNext) onNext();
            // Reload to get fresh state (and clear dirty files)
            loadData();
        } catch (err) {
            console.error("Failed to save other images", err);
            alert("Failed to save images.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded shadow-sm p-3 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Other Images</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                    const key = `image_${num}`;
                    const item = images[key] || { preview: null };

                    return (
                        <div key={key} className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image {num} <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                            </label>

                            <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 h-32 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                {item.preview ? (
                                    <>
                                        <img
                                            src={item.preview}
                                            alt={`Image ${num}`}
                                            className="max-h-full max-w-full object-contain rounded"
                                        />
                                        <button
                                            onClick={() => handleDelete(key)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                            title="Clear Image"
                                        >
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500">Upload</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, key)}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end gap-3 mt-auto pt-2 border-t">
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
                    className="px-6 py-2 text-white bg-[#546E7A] rounded-md hover:bg-[#455A64] font-medium shadow-sm flex items-center gap-2"
                >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save & Next'}
                </button>
            </div>
        </div>
    );
}
