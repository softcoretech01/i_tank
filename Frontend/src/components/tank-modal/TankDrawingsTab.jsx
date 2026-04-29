import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, Image, ExternalLink, Save } from 'lucide-react';
import { getAllDrawings } from '../../services/tankDrawingService';
import api from '../../services/api';

const DRAWING_SLOTS = [
  { field: 'pid_drawing', nameField: 'pid_drawing_name', label: 'P&ID Drawing', color: 'blue' },
  { field: 'image2_drawing_file', nameField: 'image2_drawing_file_name', label: 'Image 2', color: 'green' },
  { field: 'img3', nameField: 'img3_name', label: 'Image 3', color: 'purple' },
  { field: 'img4', nameField: 'img4_name', label: 'Image 4', color: 'amber' },
  { field: 'img5', nameField: 'img5_name', label: 'Image 5', color: 'rose' },
  { field: 'img6', nameField: 'img6_name', label: 'Image 6', color: 'indigo' },
];

const colorMap = {
  blue: { dot: 'bg-blue-500', icon: 'bg-blue-100 text-blue-600', badge: 'text-blue-500', btn: 'text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600', card: 'border-blue-100 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300' },
  green: { dot: 'bg-green-500', icon: 'bg-green-100 text-green-600', badge: 'text-green-500', btn: 'text-green-600 border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600', card: 'border-green-100 bg-green-50/30 hover:bg-green-50 hover:border-green-300' },
  purple: { dot: 'bg-purple-500', icon: 'bg-purple-100 text-purple-600', badge: 'text-purple-500', btn: 'text-purple-600 border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600', card: 'border-purple-100 bg-purple-50/30 hover:bg-purple-50 hover:border-purple-300' },
  amber: { dot: 'bg-amber-500', icon: 'bg-amber-100 text-amber-600', badge: 'text-amber-500', btn: 'text-amber-600 border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600', card: 'border-amber-100 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-300' },
  rose: { dot: 'bg-rose-500', icon: 'bg-rose-100 text-rose-600', badge: 'text-rose-500', btn: 'text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600', card: 'border-rose-100 bg-rose-50/30 hover:bg-rose-50 hover:border-rose-300' },
  indigo: { dot: 'bg-indigo-500', icon: 'bg-indigo-100 text-indigo-600', badge: 'text-indigo-500', btn: 'text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600', card: 'border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300' },
};

// Unwrap UniformResponseMiddleware envelope: {success, data, message} → data
const unwrap = (response) => {
  if (response && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
    return response.data;
  }
  return response;
};

export default function TankDrawingsTab({ tankId, onNext, onClose }) {
  const safeTankId = (typeof tankId === 'object' && tankId !== null) ? tankId.id : tankId;

  const [allDrawings, setAllDrawings] = useState([]);
  const [selectedPidId, setSelectedPidId] = useState('');
  const [drawing, setDrawing] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (safeTankId) loadData();
  }, [safeTankId]);

  const loadData = async () => {
    if (!safeTankId) return;
    try {
      setLoading(true);
      // 1. Fetch available drawings from Master
      const resData = await getAllDrawings();
      const list = Array.isArray(unwrap(resData)) ? unwrap(resData) : [];
      const activeDrawings = list.filter(item => item.status === 1);
      setAllDrawings(activeDrawings);

      // 2. Fetch tank to get current pid_id
      const res = await api.get(`/tanks/${safeTankId}`);
      const tankData = unwrap(res.data);
      if (tankData && tankData.pid_id) {
        setSelectedPidId(tankData.pid_id);
        const match = activeDrawings.find(d => String(d.id) === String(tankData.pid_id));
        if (match) setDrawing(match);
      }
    } catch (err) {
      console.error("Error loading drawings data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = async (e) => {
    const newId = e.target.value;
    setSelectedPidId(newId);

    if (newId) {
      const match = allDrawings.find(d => String(d.id) === String(newId));
      setDrawing(match || null);
    } else {
      setDrawing(null);
    }

    // Auto-save the selected ID to tank details
    try {
      setSaving(true);
      await api.put(`/tanks/${safeTankId}`, { pid_id: newId ? Number(newId) : null });
    } catch (err) {
      console.error("Failed to update pid_id on tank", err);
      alert("Failed to save selected P&ID reference. " + (err.response?.data?.message || ""));
    } finally {
      setSaving(false);
    }
  };

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
        <p className="text-sm font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded shadow-sm p-4 overflow-y-auto w-full">
      <div className="mb-6 flex flex-col gap-2 max-w-sm">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          P&ID Reference
          {saving && <span className="text-[10px] text-blue-500 animate-pulse">(Saving...)</span>}
        </label>
        <select
          value={selectedPidId}
          onChange={handleSelectionChange}
          className="h-10 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] bg-white outline-none w-full"
        >
          <option value="">-- Select P&ID Reference --</option>
          {allDrawings.map(d => (
            <option key={d.id} value={d.id}>{d.pid_reference}</option>
          ))}
        </select>
        <p className="text-[10px] text-gray-400 italic">Select one from the Drawings Master</p>
      </div>

      {!drawing ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-gray-100 rounded-xl flex-1">
          <Image className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-700">No P&ID Reference Selected</p>
          <p className="text-sm text-gray-400 mt-2 italic">Please select a reference from the dropdown above.</p>
        </div>
      ) : (
        <div className="space-y-6 flex-1">
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col gap-1 w-full">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remarks</span>
            <span className="text-base font-medium text-gray-700">{drawing.remarks || <span className="text-gray-400 italic">None</span>}</span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
              Drawing Images
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {DRAWING_SLOTS.map(({ field, nameField, label, color }) => {
                const url = drawing[field];
                const name = drawing[nameField];
                const hasFile = !!url;
                const c = colorMap[color] || colorMap['blue'];

                return (
                  <div
                    key={field}
                    className={`relative group flex flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden ${hasFile
                      ? `${c.card} cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1`
                      : 'border-gray-100 bg-gray-50/50 opacity-70 border-dashed grayscale'
                      }`}
                  >
                    <div className={`px-5 pt-4 pb-2 flex items-center gap-2`}>
                      <div className={`p-2 rounded-full ${hasFile ? c.icon : 'bg-gray-100 text-gray-400'}`}>
                        <Image className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${hasFile ? c.badge : 'text-gray-400'}`}>
                          {label}
                        </span>
                        {name && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{name}</p>
                        )}
                      </div>
                    </div>

                    {hasFile ? (
                      <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-gray-100 bg-white flex items-center justify-center p-2" style={{ height: 180 }}>
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="mx-4 mb-4 rounded-xl border border-dashed border-gray-200 bg-white flex items-center justify-center" style={{ height: 180 }}>
                        <span className="text-gray-300 text-sm font-medium">No image</span>
                      </div>
                    )}

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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t w-full">
        {onClose && (
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium shadow-sm transition-colors text-sm">
            Close
          </button>
        )}
        {onNext && (
          <button type="button" onClick={onNext} className="px-8 py-2 text-white bg-[#546E7A] rounded-md hover:bg-[#455A64] font-medium shadow-sm flex items-center transition-colors text-sm">
            Save
          </button>
        )}
      </div>
    </div>
  );
}