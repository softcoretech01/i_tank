import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Plus, Edit, Eye, Search, RotateCcw,
  FileSpreadsheet, Save, X, Upload, ArrowLeft, Image
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  getAllDrawings,
  uploadDrawing,
  updateDrawing,
  deleteDrawing
} from '../services/tankDrawingService';
import { getTanks } from '../services/tankService';
import { SearchableSelect } from '../components/ui/SearchableSelect';

// Max 2 MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Custom Toggle Component
const StatusToggle = ({ active, onToggle }) => (
  <button
    onClick={onToggle}
    title={active ? 'Active – click to deactivate' : 'Inactive – click to activate'}
    className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors focus:outline-none ${active ? 'bg-green-500' : 'bg-gray-300'
      }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${active ? 'translate-x-7' : 'translate-x-1'
        }`}
    />
  </button>
);

export default function DrawingsMasterPage({ mode = 'list' }) {
  const navigate = useNavigate();
  const { id: editingId } = useParams();
  const location = useLocation();

  // --- List State ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [searchBy, setSearchBy] = useState('tank_number');

  // --- Form State ---
  const [tanks, setTanks] = useState([]);
  const [formData, setFormData] = useState({
    pid_reference: '',
    pid_drawing: null,           // new File to upload
    image2_drawing_file: null,       // new File to upload
    pid_drawing_removed: false,  // user clicked X on existing
    image2_drawing_file_removed: false,
    img3: null,
    img4: null,
    img5: null,
    img6: null,
    img3_removed: false,
    img4_removed: false,
    img5_removed: false,
    img6_removed: false,
    remarks: '',
  });
  const [existingData, setExistingData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Initial Data Loading ---
  useEffect(() => {
    if (mode === 'list') {
      fetchDrawings();
    } else {
      fetchTanks();
      if (mode === 'edit' && editingId) {
        loadEditingData(editingId);
      }
    }
  }, [mode, editingId]);

  const fetchDrawings = async () => {
    setLoading(true);
    try {
      const data = await getAllDrawings();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to fetch drawings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTanks = async () => {
    try {
      const raw = await getTanks();
      const list = Array.isArray(raw) ? raw : (raw?.data || []);
      setTanks(list.filter(t => t.status === 'active' || t.status === 1));
    } catch (err) {
      console.error("Failed to fetch tanks:", err);
    }
  };

  const loadEditingData = async (id) => {
    try {
      const all = await getAllDrawings();
      const item = all.find(d => String(d.id) === String(id));
      if (item) {
        setExistingData(item);
        setFormData({
          pid_reference: item.pid_reference || '',
          pid_drawing: null,
          image2_drawing_file: null,
          pid_drawing_removed: false,
          image2_drawing_file_removed: false,
          img3: null,
          img4: null,
          img5: null,
          img6: null,
          img3_removed: false,
          img4_removed: false,
          img5_removed: false,
          img6_removed: false,
          remarks: item.remarks || '',
        });
      }
    } catch (err) {
      console.error("Failed to load editing data:", err);
    }
  };

  // --- Logic Helpers ---
  const filteredItems = useMemo(() => {
    let result = Array.isArray(items) ? [...items] : [];
    if (filterTerm) {
      result = result.filter(item => {
        const val = String(item[searchBy] || '').toLowerCase();
        return val.includes(filterTerm.toLowerCase());
      });
    }
    return result.sort((a, b) => (a.pid_reference || '').localeCompare(b.pid_reference || ''));
  }, [items, filterTerm, searchBy]);

  const handleSearch = () => setFilterTerm(searchTerm);
  const handleShowAll = () => {
    setSearchTerm('');
    setFilterTerm('');
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate type
    if (!['image/jpeg', 'image/jpg'].includes(file.type.toLowerCase())) {
      alert(`Only JPEG/JPG images are allowed for ${field === 'pid_drawing' ? 'P&ID Drawing' : 'Image 2'}.`);
      e.target.value = '';
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size must not exceed 2 MB. Selected file: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      e.target.value = '';
      return;
    }
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('pid_reference', formData.pid_reference || '');
      fd.append('remarks', formData.remarks || '');

      // New files
      if (formData.pid_drawing) {
        fd.append('pid_drawing_file', formData.pid_drawing);
      }
      if (formData.image2_drawing_file) {
        fd.append('image2_drawing_file', formData.image2_drawing_file);
      }

      // Clear flags (only in edit mode)
      if (mode === 'edit') {
        if (formData.pid_drawing_removed && !formData.pid_drawing) {
          fd.append('clear_pid_drawing', '1');
        }
        if (formData.image2_drawing_file_removed && !formData.image2_drawing_file) {
          fd.append('clear_image2_drawing_file', '1');
        }
        for (let i = 3; i <= 6; i++) {
          if (formData[`img${i}_removed`] && !formData[`img${i}`]) {
            fd.append(`clear_img${i}`, '1');
          }
        }
      }

      // New files (standardized fields)
      if (formData.pid_drawing) fd.append('pid_drawing_file', formData.pid_drawing);
      if (formData.image2_drawing_file) fd.append('image2_drawing_file', formData.image2_drawing_file);
      for (let i = 3; i <= 6; i++) {
        if (formData[`img${i}`]) {
          fd.append(`img${i}_file`, formData[`img${i}`]);
        }
      }

      if (mode === 'edit' && editingId) {
        await updateDrawing(editingId, fd);
        alert("Drawing updated successfully");
      } else {
        await uploadDrawing(fd);
        alert("Drawing added successfully");
      }
      navigate('/masters/drawings');
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save drawing. " + (err.response?.data?.message || err.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const currentStatus = Number(item.status ?? 1);
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      await updateDrawing(item.id, fd);
      // Optimistically update the local list
      setItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i)
      );
    } catch (err) {
      console.error("Status toggle failed:", err);
      alert("Failed to update status");
    }
  };

  // --- Upload Card Component ---
  const ImageUploadCard = ({ field, label }) => {
    const file = formData[field];                    // newly selected File
    const removedKey = `${field}_removed`;
    const isRemoved = formData[removedKey] === true;
    const existingUrl = (!isRemoved && existingData) ? existingData[field] : null;
    const existingName = existingData
      ? existingData[`${field}_name`] || existingData[`${field}ing_name`] || existingData[`${field}_file_name`]
      : null;

    // State A: New file just picked
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      return (
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-bold text-gray-700">{label}</label>
            <span className="text-[10px] text-gray-400 italic">JPEG only · Max 2 MB</span>
          </div>
          <div className="relative group border-2 border-green-400 rounded-xl overflow-hidden bg-gray-50" style={{ height: 160 }}>
            <img src={previewUrl} alt={label} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                className="p-2 bg-white text-blue-600 rounded-full shadow hover:bg-blue-600 hover:text-white transition-colors" title="View">
                <Eye className="w-4 h-4" />
              </a>
              <button type="button"
                onClick={() => setFormData(p => ({ ...p, [field]: null }))}
                className="p-2 bg-white text-red-500 rounded-full shadow hover:bg-red-500 hover:text-white transition-colors" title="Remove">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <label className="flex items-center justify-center gap-1 cursor-pointer text-xs text-[#10B981] hover:text-[#059669] font-semibold py-1">
            <Upload className="w-3 h-3" /> {file.name}
            <input type="file" accept=".jpg,.jpeg,image/jpeg" className="hidden"
              onChange={(e) => handleFileChange(e, field)} />
          </label>
        </div>
      );
    }

    // State B: Existing image (from DB), not yet removed
    if (existingUrl) {
      return (
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-bold text-gray-700">{label}</label>
            <span className="text-[10px] text-gray-400 italic">JPEG only · Max 2 MB</span>
          </div>
          <div className="relative group border-2 border-green-200 rounded-xl overflow-hidden bg-gray-50" style={{ height: 160 }}>
            <img src={existingUrl} alt={label} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <a href={existingUrl} target="_blank" rel="noopener noreferrer"
                className="p-2 bg-white text-blue-600 rounded-full shadow hover:bg-blue-600 hover:text-white transition-colors" title="View">
                <Eye className="w-4 h-4" />
              </a>
              {/* X — marks for removal on save */}
              <button type="button"
                onClick={() => setFormData(p => ({ ...p, [removedKey]: true }))}
                className="p-2 bg-white text-red-500 rounded-full shadow hover:bg-red-500 hover:text-white transition-colors" title="Remove image">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <label className="flex items-center justify-center gap-1 cursor-pointer text-xs text-[#10B981] hover:text-[#059669] font-semibold py-1">
            <Upload className="w-3 h-3" /> {existingName || 'Replace image'}
            <input type="file" accept=".jpg,.jpeg,image/jpeg" className="hidden"
              onChange={(e) => handleFileChange(e, field)} />
          </label>
        </div>
      );
    }

    // State C: Empty slot (no existing, or just removed)
    return (
      <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
        <div className="flex justify-between items-center px-1">
          <label className="text-sm font-bold text-gray-700">{label}</label>
          <span className="text-[10px] text-gray-400 italic">JPEG only · Max 2 MB</span>
        </div>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#10B981] hover:bg-green-50 transition-all cursor-pointer" style={{ height: 160 }}>
          <Image className="w-8 h-8 text-gray-300" />
          <span className="text-xs text-gray-400">Click to upload JPEG</span>
          <input type="file" accept=".jpg,.jpeg,image/jpeg" className="hidden"
            onChange={(e) => handleFileChange(e, field)} />
        </label>
      </div>
    );
  };

  // --- Views ---

  if (mode === 'list') {
    return (
      <div className="flex flex-col flex-1 p-2 bg-gray-50 h-screen overflow-hidden">
        <div className="bg-white rounded-lg shadow-md flex flex-col h-full border border-gray-200 overflow-hidden">

          {/* Header Section */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-[#546E7A]">Drawings Master</h1>
              <Button
                onClick={() => navigate('/masters/drawings/add')}
                variant="primary"
                icon={Plus}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] px-6"
              >
                Add Drawing
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-gray-700 font-semibold">Search by</span>

              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="h-10 px-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none bg-white min-w-[150px]"
              >
                <option value="pid_reference">P&ID Reference</option>
                <option value="remarks">Remarks</option>
              </select>

              <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-10 w-full pl-10 pr-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} icon={Search} className="bg-[#455A64] hover:bg-[#37474F]">
                  Search
                </Button>
                <Button onClick={handleShowAll} icon={RotateCcw} className="bg-[#455A64] hover:bg-[#37474F]">
                  Show All
                </Button>
                <Button variant="primary" icon={FileSpreadsheet} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                  Export to Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#455A64] text-white z-10">
                <tr>
                  <th className="px-6 py-4 text-left font-bold uppercase text-xs tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left font-bold uppercase text-xs tracking-wider">P&ID Reference</th>
                  <th className="px-6 py-4 text-left font-bold uppercase text-xs tracking-wider">Remarks</th>
                  <th className="px-6 py-4 text-center font-bold uppercase text-xs tracking-wider">Images</th>
                  <th className="px-6 py-4 text-right font-bold uppercase text-xs tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="7" className="py-10 text-center text-gray-400 italic">Loading drawings...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan="7" className="py-10 text-center text-gray-400 italic">No records found.</td></tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{item.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.pid_reference || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 italic max-w-[120px] truncate" title={item.remarks}>{item.remarks || '-'}</td>
                      <td className="px-6 py-4 text-center text-sm">
                        {(() => {
                          const count = [
                            item.pid_drawing,
                            item.image2_drawing_file,
                            item.img3,
                            item.img4,
                            item.img5,
                            item.img6
                          ].filter(Boolean).length;
                          return (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              <Image className="w-3 h-3" /> {count}/6
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            onClick={() => navigate(`/masters/drawings/edit/${item.id}`)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <StatusToggle
                            active={Number(item.status ?? 1) === 1}
                            onToggle={() => handleToggleStatus(item)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- Add/Edit Form View ---
  return (
    <div className="flex flex-col flex-1 p-2 bg-gray-100 h-screen overflow-hidden">
      <div className="w-full flex flex-col h-full space-y-2">

        {/* Header with Back Button */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => navigate('/masters/drawings')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-[#546E7A]" />
          </button>
          <h1 className="text-2xl font-bold text-[#546E7A]">
            {mode === 'edit' ? 'Edit Drawing' : 'Add New Drawing'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 overflow-auto flex-1">
          <form onSubmit={handleSave} className="space-y-4">

            {/* Row 1: Tank + Text References */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* P&ID Reference (text) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">P&ID Reference</label>
                <input
                  type="text"
                  placeholder="e.g. CIMC-PNID-001"
                  value={formData.pid_reference}
                  onChange={(e) => setFormData(p => ({ ...p, pid_reference: e.target.value }))}
                  className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none"
                />
              </div>
            </div>

            {/* Row: Remarks */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Remarks</label>
              <input
                type="text"
                placeholder="Enter remarks (max 30 chars)..."
                maxLength={30}
                value={formData.remarks}
                onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                className="h-11 border border-gray-300 rounded px-3 focus:ring-2 focus:ring-[#546E7A] outline-none"
              />
            </div>

            {/* Row 2: Two JPEG Upload Slots */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Drawing Images</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ImageUploadCard field="pid_drawing" label="P&ID Drawing" />
                <ImageUploadCard field="image2_drawing_file" label="Image 2" />
                <ImageUploadCard field="img3" label="Image 3" />
                <ImageUploadCard field="img4" label="Image 4" />
                <ImageUploadCard field="img5" label="Image 5" />
                <ImageUploadCard field="img6" label="Image 6" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/masters/drawings')}
                className="px-8 h-11 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-bold transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
