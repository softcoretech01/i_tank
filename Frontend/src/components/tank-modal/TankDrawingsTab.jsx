import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, Image, ExternalLink } from 'lucide-react';
import { getTankDrawings } from '../../services/tankDrawingService';

const DRAWING_SLOTS = [
  { field: 'pid_drawing', nameField: 'pid_drawing_name', label: 'P&ID Drawing', color: 'blue' },
  { field: 'ga_drawing_file', nameField: 'ga_drawing_file_name', label: 'GA Drawing', color: 'green' },
];

const colorMap = {
  blue: { dot: 'bg-blue-500', icon: 'bg-blue-100 text-blue-600', badge: 'text-blue-500', btn: 'text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600', card: 'border-blue-100 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300' },
  green: { dot: 'bg-green-500', icon: 'bg-green-100 text-green-600', badge: 'text-green-500', btn: 'text-green-600 border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600', card: 'border-green-100 bg-green-50/30 hover:bg-green-50 hover:border-green-300' },
};

export default function TankDrawingsTab({ tankId }) {
  const safeTankId = (typeof tankId === 'object' && tankId !== null) ? tankId.id : tankId;

  const [drawing, setDrawing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDrawing = async () => {
    if (!safeTankId) return;
    try {
      setLoading(true);
      const data = await getTankDrawings(safeTankId);
      const list = Array.isArray(data) ? data : [];
      // Only show active drawings (status === 1)
      const activeDrawing = list.find(item => item.status === 1);
      setDrawing(activeDrawing || null);
    } catch (err) {
      console.error("Error loading drawing:", err);
      setError("Failed to load drawings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (safeTankId) loadDrawing();
  }, [safeTankId]);

  if (!safeTankId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
        <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
        <p className="text-lg font-medium text-gray-700">Please save the "Tank Basic Details" first.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#54737E] mb-4"></div>
        <p className="text-sm font-medium">Loading drawings...</p>
      </div>
    );
  }

  if (!drawing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-gray-100 rounded-xl">
        <Image className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-lg font-bold text-gray-700">No Drawings uploaded for this tank</p>
        <p className="text-sm text-gray-400 mt-2 italic">You can add drawings from the Drawings Master menu.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8 animate-in fade-in duration-300">

      {/* Text Reference Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">P&ID Reference</label>
          <p className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {drawing.pid_reference || <span className="text-gray-300 italic">Not set</span>}
          </p>
        </div>

        <div className="space-y-2 p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">GA Drawing Reference</label>
          <p className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {drawing.ga_drawing || <span className="text-gray-300 italic">Not set</span>}
          </p>
        </div>
      </div>

      {/* JPEG Image Attachments */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
          Drawing Images
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DRAWING_SLOTS.map(({ field, nameField, label, color }) => {
            const url = drawing[field];
            const name = drawing[nameField];
            const hasFile = !!url;
            const c = colorMap[color];

            return (
              <div
                key={field}
                className={`relative group flex flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden ${hasFile
                    ? `${c.card} cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1`
                    : 'border-gray-100 bg-gray-50/50 opacity-70 border-dashed grayscale'
                  }`}
              >
                {/* Label bar */}
                <div className={`px-5 pt-4 pb-2 flex items-center gap-2`}>
                  <div className={`p-2 rounded-full ${hasFile ? c.icon : 'bg-gray-100 text-gray-400'}`}>
                    <Image className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${hasFile ? c.badge : 'text-gray-400'}`}>
                      {label}
                    </span>
                    {name && (
                      <p className="text-xs text-gray-500 truncate max-w-[220px]">{name}</p>
                    )}
                  </div>
                </div>

                {/* Image preview */}
                {hasFile ? (
                  <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-gray-100 bg-white" style={{ height: 200 }}>
                    <img
                      src={url}
                      alt={label}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="mx-4 mb-4 rounded-xl border border-dashed border-gray-200 bg-white flex items-center justify-center" style={{ height: 200 }}>
                    <span className="text-gray-300 text-sm font-medium">No image uploaded</span>
                  </div>
                )}

                {/* Action */}
                {hasFile && (
                  <div className="px-4 pb-4">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-full border text-xs font-bold shadow-sm transition-all duration-200 group-hover:scale-105 ${c.btn}`}
                    >
                      <Eye className="w-3 h-3" />
                      View Full Size
                    </a>
                  </div>
                )}

                {!hasFile && (
                  <div className="px-4 pb-4">
                    <span className="flex items-center justify-center px-4 py-2 bg-transparent text-gray-300 text-[10px] font-bold uppercase tracking-widest border border-gray-100 rounded-full">
                      Unavailable
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}