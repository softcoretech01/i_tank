import React, { useState, useEffect } from 'react';
import api, { getUploadUrl } from '../../services/api';
import { Upload, X } from 'lucide-react';

// Unwrap UniformResponseMiddleware envelope: {success, data, message} → data
const unwrap = (response) => {
    if (response && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
        return response.data;
    }
    return response;
};

export default function TankValveAndShellTab({ tankId, onNext, onClose }) {
    const [loading, setLoading] = useState(false);
    const [valvePreview, setValvePreview] = useState(null);
    const [framePreview, setFramePreview] = useState(null);

    useEffect(() => {
        if (tankId) {
            loadData();
        }
    }, [tankId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tank-valve-and-shell/tank/${tankId}`);
            const data = unwrap(res.data);
            
            if (data && data.status !== 0) {
                if (data.valve_label_image_url) setValvePreview(data.valve_label_image_url);
                if (data.tank_frame_image_url) setFramePreview(data.tank_frame_image_url);
            }
        } catch (err) {
            console.error("Failed to load valve/shell data", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded shadow-sm p-3 overflow-y-auto">
            <div className="flex flex-col md:flex-row gap-4 flex-grow">
                {/* VALVE LABEL SECTION */}
                <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-700 mb-2">Valve Label</h3>
                    <div className="flex-grow flex flex-col items-center justify-center border-2 border-gray-100 rounded-lg bg-gray-50/50 p-3 min-h-[250px]">
                        {valvePreview ? (
                            <img
                                src={valvePreview}
                                alt="Valve Label"
                                className="max-w-full max-h-64 object-contain rounded shadow-sm cursor-zoom-in"
                                onClick={() => window.open(valvePreview, '_blank')}
                            />
                        ) : (
                            <div className="text-center text-gray-400">
                                <Upload className="mx-auto h-10 w-10 mb-2 opacity-20" />
                                <span className="text-sm italic">No Valve Label image uploaded</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* TANK FRAME SECTION */}
                <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-700 mb-2">Tank Frame Outer Shell</h3>
                    <div className="flex-grow flex flex-col items-center justify-center border-2 border-gray-100 rounded-lg bg-gray-50/50 p-3 min-h-[250px]">
                        {framePreview ? (
                            <img
                                src={framePreview}
                                alt="Tank Frame"
                                className="max-w-full max-h-64 object-contain rounded shadow-sm cursor-zoom-in"
                                onClick={() => window.open(framePreview, '_blank')}
                            />
                        ) : (
                            <div className="text-center text-gray-400">
                                <Upload className="mx-auto h-10 w-10 mb-2 opacity-20" />
                                <span className="text-sm italic">No Tank Frame image uploaded</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-3 border-t">
                <span className="text-xs text-gray-400 italic">
                    Note: To update these photos, please use the <b>Valve & Shell Master</b> screen.
                </span>
                <div className="flex gap-3">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium shadow-sm transition-colors"
                        >
                            Close
                        </button>
                    )}
                    {onNext && (
                        <button
                            onClick={onNext}
                            className="px-8 py-2 text-white bg-[#546E7A] rounded-md hover:bg-[#455A64] font-medium shadow-sm flex items-center transition-colors"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
